
CREATE TYPE public.credit_entry_type AS ENUM ('charge','refund','adjustment','topup','reset');

CREATE TABLE public.credit_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter',
  period text NOT NULL DEFAULT to_char(now(),'YYYY-MM'),
  included integer NOT NULL DEFAULT 200,
  topups integer NOT NULL DEFAULT 0,
  used numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL,
  entry_type public.credit_entry_type NOT NULL,
  kind text NOT NULL,
  label text NOT NULL,
  credits numeric NOT NULL,
  balance_after numeric,
  request_id text,
  reverses_id uuid REFERENCES public.credit_ledger(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX credit_ledger_request_id_key ON public.credit_ledger (user_id, request_id) WHERE request_id IS NOT NULL;
CREATE INDEX credit_ledger_user_created_idx ON public.credit_ledger (user_id, created_at DESC);
CREATE INDEX credit_ledger_user_kind_idx ON public.credit_ledger (user_id, kind, created_at DESC);

CREATE TABLE public.credit_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_period text NOT NULL,
  to_period text NOT NULL,
  used_before numeric NOT NULL,
  topups_before integer NOT NULL,
  included_before integer NOT NULL,
  plan text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credit_accounts TO authenticated;
GRANT ALL ON public.credit_accounts TO service_role;
GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
GRANT SELECT ON public.credit_resets TO authenticated;
GRANT ALL ON public.credit_resets TO service_role;

ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own credit account" ON public.credit_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users read own ledger" ON public.credit_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users read own resets" ON public.credit_resets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_credit_accounts_updated_at BEFORE UPDATE ON public.credit_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- plan catalog: included credits + rate limits
CREATE OR REPLACE FUNCTION public.credit_plan_config(_plan text)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(coalesce(_plan,'starter'))
    WHEN 'team' THEN '{"included":4000,"limits":{"vega_message":{"per_minute":30,"per_day":1500},"agent_run":{"per_minute":6,"per_day":300},"security_scan":{"per_minute":10,"per_day":400},"blueprint":{"per_minute":3,"per_day":60}}}'::jsonb
    WHEN 'scale' THEN '{"included":40000,"limits":{"vega_message":{"per_minute":90,"per_day":10000},"agent_run":{"per_minute":20,"per_day":2000},"security_scan":{"per_minute":40,"per_day":4000},"blueprint":{"per_minute":10,"per_day":400}}}'::jsonb
    WHEN 'enterprise' THEN '{"included":250000,"limits":{"vega_message":{"per_minute":300,"per_day":100000},"agent_run":{"per_minute":100,"per_day":20000},"security_scan":{"per_minute":200,"per_day":40000},"blueprint":{"per_minute":40,"per_day":4000}}}'::jsonb
    ELSE '{"included":200,"limits":{"vega_message":{"per_minute":10,"per_day":100},"agent_run":{"per_minute":2,"per_day":20},"security_scan":{"per_minute":4,"per_day":40},"blueprint":{"per_minute":1,"per_day":5}}}'::jsonb
  END
$$;

CREATE OR REPLACE FUNCTION public.credit_cost(_kind text)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _kind WHEN 'vega_message' THEN 1 WHEN 'agent_run' THEN 4 WHEN 'security_scan' THEN 2 WHEN 'blueprint' THEN 12 ELSE 1 END::numeric
$$;

-- ensures the account exists, applies monthly reset + audit row, returns the account
CREATE OR REPLACE FUNCTION public.ensure_credit_account(_user_id uuid, _plan text DEFAULT NULL)
RETURNS public.credit_accounts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  acct public.credit_accounts;
  cur_period text := to_char(now(),'YYYY-MM');
  eff_plan text;
BEGIN
  INSERT INTO public.credit_accounts (user_id, plan, period, included)
  VALUES (_user_id, coalesce(_plan,'starter'), cur_period,
          (public.credit_plan_config(coalesce(_plan,'starter'))->>'included')::int)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO acct FROM public.credit_accounts WHERE user_id = _user_id FOR UPDATE;

  eff_plan := coalesce(_plan, acct.plan);

  IF acct.period <> cur_period THEN
    INSERT INTO public.credit_resets (user_id, from_period, to_period, used_before, topups_before, included_before, plan)
    VALUES (_user_id, acct.period, cur_period, acct.used, acct.topups, acct.included, acct.plan);

    INSERT INTO public.credit_ledger (user_id, period, entry_type, kind, label, credits, balance_after, metadata)
    VALUES (_user_id, cur_period, 'reset', 'period_reset',
            format('Monthly reset %s → %s', acct.period, cur_period), 0, 0,
            jsonb_build_object('used_before', acct.used, 'topups_before', acct.topups));

    UPDATE public.credit_accounts
       SET period = cur_period, used = 0, topups = 0, plan = eff_plan,
           included = (public.credit_plan_config(eff_plan)->>'included')::int
     WHERE user_id = _user_id
     RETURNING * INTO acct;
  ELSIF eff_plan <> acct.plan THEN
    UPDATE public.credit_accounts
       SET plan = eff_plan, included = (public.credit_plan_config(eff_plan)->>'included')::int
     WHERE user_id = _user_id
     RETURNING * INTO acct;
  END IF;

  RETURN acct;
END;
$$;

-- read-only snapshot: balance, quotas, rate-limit windows
CREATE OR REPLACE FUNCTION public.credit_snapshot(_plan text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  acct public.credit_accounts;
  cfg jsonb;
  k text;
  limits jsonb := '{}'::jsonb;
  used_min int;
  used_day int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  acct := public.ensure_credit_account(uid, _plan);
  cfg := public.credit_plan_config(acct.plan);

  FOR k IN SELECT jsonb_object_keys(cfg->'limits') LOOP
    SELECT count(*) INTO used_min FROM public.credit_ledger
     WHERE user_id = uid AND kind = k AND entry_type = 'charge' AND created_at > now() - interval '1 minute';
    SELECT count(*) INTO used_day FROM public.credit_ledger
     WHERE user_id = uid AND kind = k AND entry_type = 'charge' AND created_at > now() - interval '1 day';
    limits := limits || jsonb_build_object(k, jsonb_build_object(
      'cost', public.credit_cost(k),
      'per_minute', (cfg->'limits'->k->>'per_minute')::int,
      'per_day', (cfg->'limits'->k->>'per_day')::int,
      'used_minute', used_min,
      'used_day', used_day,
      'remaining_minute', greatest(0, (cfg->'limits'->k->>'per_minute')::int - used_min),
      'remaining_day', greatest(0, (cfg->'limits'->k->>'per_day')::int - used_day)
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'plan', acct.plan,
    'period', acct.period,
    'included', acct.included,
    'topups', acct.topups,
    'used', acct.used,
    'total', acct.included + acct.topups,
    'remaining', greatest(0, acct.included + acct.topups - acct.used),
    'limits', limits
  );
END;
$$;

-- atomic charge: balance + rate limits enforced, idempotent on request_id
CREATE OR REPLACE FUNCTION public.consume_credits(
  _kind text, _label text, _multiplier numeric DEFAULT 1,
  _request_id text DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb, _plan text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  acct public.credit_accounts;
  cfg jsonb;
  cost numeric;
  remaining numeric;
  existing public.credit_ledger;
  used_min int;
  used_day int;
  lim_min int;
  lim_day int;
  entry public.credit_ledger;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  IF _request_id IS NOT NULL THEN
    SELECT * INTO existing FROM public.credit_ledger WHERE user_id = uid AND request_id = _request_id LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', true, 'idempotent', true, 'entry_id', existing.id,
                                'charged', existing.credits, 'snapshot', public.credit_snapshot(_plan));
    END IF;
  END IF;

  acct := public.ensure_credit_account(uid, _plan);
  cfg := public.credit_plan_config(acct.plan);
  cost := public.credit_cost(_kind) * greatest(_multiplier, 0);
  remaining := acct.included + acct.topups - acct.used;

  lim_min := coalesce((cfg->'limits'->_kind->>'per_minute')::int, 60);
  lim_day := coalesce((cfg->'limits'->_kind->>'per_day')::int, 5000);
  SELECT count(*) INTO used_min FROM public.credit_ledger
   WHERE user_id = uid AND kind = _kind AND entry_type = 'charge' AND created_at > now() - interval '1 minute';
  SELECT count(*) INTO used_day FROM public.credit_ledger
   WHERE user_id = uid AND kind = _kind AND entry_type = 'charge' AND created_at > now() - interval '1 day';

  IF used_min >= lim_min THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited', 'window', 'minute',
      'limit', lim_min, 'retry_after_seconds', 60, 'snapshot', public.credit_snapshot(acct.plan));
  END IF;
  IF used_day >= lim_day THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited', 'window', 'day',
      'limit', lim_day, 'retry_after_seconds', 3600, 'snapshot', public.credit_snapshot(acct.plan));
  END IF;
  IF remaining < cost THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_credits', 'required', cost,
      'remaining', remaining, 'snapshot', public.credit_snapshot(acct.plan));
  END IF;

  UPDATE public.credit_accounts SET used = used + cost WHERE user_id = uid RETURNING * INTO acct;

  INSERT INTO public.credit_ledger (user_id, period, entry_type, kind, label, credits, balance_after, request_id, metadata)
  VALUES (uid, acct.period, 'charge', _kind, _label, cost,
          acct.included + acct.topups - acct.used, _request_id, coalesce(_metadata,'{}'::jsonb))
  RETURNING * INTO entry;

  RETURN jsonb_build_object('ok', true, 'entry_id', entry.id, 'charged', cost,
                            'snapshot', public.credit_snapshot(acct.plan));
END;
$$;

-- refund a previous charge (full or partial)
CREATE OR REPLACE FUNCTION public.refund_credits(_entry_id uuid, _reason text DEFAULT 'refund', _amount numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  src public.credit_ledger;
  already numeric;
  amt numeric;
  acct public.credit_accounts;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO src FROM public.credit_ledger WHERE id = _entry_id AND user_id = uid AND entry_type = 'charge';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'entry_not_found'); END IF;

  SELECT coalesce(sum(abs(credits)),0) INTO already FROM public.credit_ledger
   WHERE user_id = uid AND reverses_id = src.id AND entry_type = 'refund';
  amt := least(coalesce(_amount, src.credits - already), src.credits - already);
  IF amt <= 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'already_refunded'); END IF;

  UPDATE public.credit_accounts SET used = greatest(0, used - amt) WHERE user_id = uid RETURNING * INTO acct;

  INSERT INTO public.credit_ledger (user_id, period, entry_type, kind, label, credits, balance_after, reverses_id, metadata)
  VALUES (uid, acct.period, 'refund', src.kind, coalesce(_reason,'refund') || ' · ' || src.label, -amt,
          acct.included + acct.topups - acct.used, src.id, jsonb_build_object('reason', _reason));

  RETURN jsonb_build_object('ok', true, 'refunded', amt, 'snapshot', public.credit_snapshot(acct.plan));
END;
$$;

-- manual adjustment / top-up
CREATE OR REPLACE FUNCTION public.adjust_credits(_amount numeric, _label text, _kind text DEFAULT 'adjustment')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  acct public.credit_accounts;
  etype public.credit_entry_type;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  acct := public.ensure_credit_account(uid, NULL);
  etype := CASE WHEN _kind = 'topup' THEN 'topup'::public.credit_entry_type ELSE 'adjustment'::public.credit_entry_type END;

  IF etype = 'topup' THEN
    UPDATE public.credit_accounts SET topups = topups + greatest(_amount,0)::int WHERE user_id = uid RETURNING * INTO acct;
  ELSE
    UPDATE public.credit_accounts SET used = greatest(0, used - _amount) WHERE user_id = uid RETURNING * INTO acct;
  END IF;

  INSERT INTO public.credit_ledger (user_id, period, entry_type, kind, label, credits, balance_after)
  VALUES (uid, acct.period, etype, _kind, _label, _amount, acct.included + acct.topups - acct.used);

  RETURN jsonb_build_object('ok', true, 'snapshot', public.credit_snapshot(acct.plan));
END;
$$;

GRANT EXECUTE ON FUNCTION public.credit_snapshot(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credits(text, text, numeric, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_credits(numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_plan_config(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_cost(text) TO authenticated;
