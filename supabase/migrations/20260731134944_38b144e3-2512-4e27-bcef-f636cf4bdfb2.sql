-- 1. Incident log for credit enforcement monitoring
CREATE TYPE public.credit_incident_kind AS ENUM (
  'enforcement_failure','idempotency_conflict','rate_limited','insufficient_credits','refund_anomaly','stream_refund'
);

CREATE TABLE public.credit_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.credit_incident_kind NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  surface text NOT NULL DEFAULT 'unknown',
  message text NOT NULL,
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX credit_incidents_created_idx ON public.credit_incidents (created_at DESC);
CREATE INDEX credit_incidents_kind_idx ON public.credit_incidents (kind, created_at DESC);
CREATE INDEX credit_incidents_user_idx ON public.credit_incidents (user_id, created_at DESC);

GRANT SELECT ON public.credit_incidents TO authenticated;
GRANT ALL ON public.credit_incidents TO service_role;
ALTER TABLE public.credit_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own incidents" ON public.credit_incidents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all incidents" ON public.credit_incidents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_credit_incidents_updated_at BEFORE UPDATE ON public.credit_incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Admin action audit trail
CREATE TABLE public.credit_admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  amount numeric,
  reason text NOT NULL,
  entry_id uuid,
  before_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX credit_admin_audit_created_idx ON public.credit_admin_audit (created_at DESC);
CREATE INDEX credit_admin_audit_target_idx ON public.credit_admin_audit (target_user_id, created_at DESC);

GRANT SELECT ON public.credit_admin_audit TO authenticated;
GRANT ALL ON public.credit_admin_audit TO service_role;
ALTER TABLE public.credit_admin_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit" ON public.credit_admin_audit
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Incident logging (any authenticated caller logs for itself; admins may target a user)
CREATE OR REPLACE FUNCTION public.log_credit_incident(
  _kind public.credit_incident_kind,
  _message text,
  _severity text DEFAULT 'warning',
  _surface text DEFAULT 'unknown',
  _request_id text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb,
  _user_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  target uuid;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  target := CASE WHEN _user_id IS NOT NULL AND public.has_role(uid,'admin') THEN _user_id ELSE uid END;
  INSERT INTO public.credit_incidents (user_id, kind, severity, surface, message, request_id, metadata)
  VALUES (target, _kind, coalesce(_severity,'warning'), coalesce(_surface,'unknown'),
          left(_message, 500), _request_id, coalesce(_metadata,'{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_credit_incident(public.credit_incident_kind,text,text,text,text,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_credit_incident(public.credit_incident_kind,text,text,text,text,jsonb,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_credit_incident(_incident_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.credit_incidents SET resolved_at = now(), resolved_by = uid WHERE id = _incident_id;
  RETURN jsonb_build_object('ok', FOUND);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.resolve_credit_incident(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_credit_incident(uuid) TO authenticated;

-- 4. Admin health metrics + alert thresholds
CREATE OR REPLACE FUNCTION public.credit_ops_metrics(_hours int DEFAULT 24)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  win interval;
  charges numeric := 0; charge_count int := 0;
  refunds numeric := 0; refund_count int := 0;
  refund_rate numeric := 0;
  incidents jsonb := '{}'::jsonb;
  open_critical int := 0;
  top_refunders jsonb := '[]'::jsonb;
  series jsonb := '[]'::jsonb;
  alerts jsonb := '[]'::jsonb;
  enforcement_failures int := 0;
  idem_conflicts int := 0;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  win := make_interval(hours => greatest(1, least(coalesce(_hours,24), 720)));

  SELECT coalesce(sum(credits),0), count(*) INTO charges, charge_count
    FROM public.credit_ledger WHERE entry_type='charge' AND created_at > now() - win;
  SELECT coalesce(abs(sum(credits)),0), count(*) INTO refunds, refund_count
    FROM public.credit_ledger WHERE entry_type='refund' AND created_at > now() - win;
  refund_rate := CASE WHEN charges > 0 THEN round((refunds / charges) * 100, 2) ELSE 0 END;

  SELECT coalesce(jsonb_object_agg(kind, cnt), '{}'::jsonb) INTO incidents FROM (
    SELECT kind::text AS kind, count(*) AS cnt FROM public.credit_incidents
     WHERE created_at > now() - win GROUP BY kind
  ) s;

  SELECT count(*) INTO open_critical FROM public.credit_incidents
   WHERE resolved_at IS NULL AND severity = 'critical' AND created_at > now() - win;
  SELECT count(*) INTO enforcement_failures FROM public.credit_incidents
   WHERE kind = 'enforcement_failure' AND created_at > now() - win;
  SELECT count(*) INTO idem_conflicts FROM public.credit_incidents
   WHERE kind = 'idempotency_conflict' AND created_at > now() - win;

  SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO top_refunders FROM (
    SELECT l.user_id,
           coalesce(sum(CASE WHEN l.entry_type='charge' THEN l.credits ELSE 0 END),0) AS charged,
           coalesce(abs(sum(CASE WHEN l.entry_type='refund' THEN l.credits ELSE 0 END)),0) AS refunded,
           CASE WHEN sum(CASE WHEN l.entry_type='charge' THEN l.credits ELSE 0 END) > 0
                THEN round(abs(sum(CASE WHEN l.entry_type='refund' THEN l.credits ELSE 0 END))
                     / sum(CASE WHEN l.entry_type='charge' THEN l.credits ELSE 0 END) * 100, 2)
                ELSE 0 END AS refund_rate
      FROM public.credit_ledger l
     WHERE l.created_at > now() - win
     GROUP BY l.user_id
     HAVING abs(sum(CASE WHEN l.entry_type='refund' THEN l.credits ELSE 0 END)) > 0
     ORDER BY 4 DESC, 3 DESC
     LIMIT 10
  ) t;

  SELECT coalesce(jsonb_agg(row_to_json(h) ORDER BY h.bucket), '[]'::jsonb) INTO series FROM (
    SELECT date_trunc('hour', created_at) AS bucket,
           sum(CASE WHEN entry_type='charge' THEN credits ELSE 0 END) AS charged,
           abs(sum(CASE WHEN entry_type='refund' THEN credits ELSE 0 END)) AS refunded
      FROM public.credit_ledger
     WHERE created_at > now() - win
     GROUP BY 1
  ) h;

  IF refund_rate >= 25 THEN
    alerts := alerts || jsonb_build_array(jsonb_build_object(
      'id','refund_rate','severity','critical','title','Abnormal refund rate',
      'detail', format('%s%% of charged credits were refunded in the window (threshold 25%%).', refund_rate)));
  ELSIF refund_rate >= 10 THEN
    alerts := alerts || jsonb_build_array(jsonb_build_object(
      'id','refund_rate','severity','warning','title','Elevated refund rate',
      'detail', format('%s%% of charged credits were refunded (threshold 10%%).', refund_rate)));
  END IF;

  IF enforcement_failures > 0 THEN
    alerts := alerts || jsonb_build_array(jsonb_build_object(
      'id','enforcement','severity', CASE WHEN enforcement_failures >= 5 THEN 'critical' ELSE 'warning' END,
      'title','Credit enforcement failures',
      'detail', format('%s enforcement failure(s) recorded — charges may not have been applied.', enforcement_failures)));
  END IF;

  IF idem_conflicts >= 3 THEN
    alerts := alerts || jsonb_build_array(jsonb_build_object(
      'id','idempotency','severity','warning','title','Idempotency conflicts',
      'detail', format('%s duplicate request replays detected — clients may be retrying aggressively.', idem_conflicts)));
  END IF;

  RETURN jsonb_build_object(
    'window_hours', greatest(1, least(coalesce(_hours,24), 720)),
    'generated_at', now(),
    'charges', charges, 'charge_count', charge_count,
    'refunds', refunds, 'refund_count', refund_count,
    'refund_rate', refund_rate,
    'incidents', incidents,
    'open_critical', open_critical,
    'enforcement_failures', enforcement_failures,
    'idempotency_conflicts', idem_conflicts,
    'top_refunders', top_refunders,
    'series', series,
    'alerts', alerts
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.credit_ops_metrics(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.credit_ops_metrics(int) TO authenticated;

-- 5. Admin listings
CREATE OR REPLACE FUNCTION public.admin_credit_accounts(_search text DEFAULT NULL, _limit int DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); rows jsonb;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT coalesce(jsonb_agg(row_to_json(t) ORDER BY t.updated_at DESC), '[]'::jsonb) INTO rows FROM (
    SELECT a.user_id, u.email::text AS email, a.plan, a.period, a.included, a.topups, a.used,
           (a.included + a.topups - a.used) AS remaining, a.updated_at
      FROM public.credit_accounts a
      JOIN auth.users u ON u.id = a.user_id
     WHERE _search IS NULL OR _search = '' OR u.email ILIKE '%' || _search || '%'
     LIMIT greatest(1, least(coalesce(_limit,50), 200))
  ) t;
  RETURN rows;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_credit_accounts(text,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_credit_accounts(text,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_credit_ledger(_user_id uuid, _limit int DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); rows jsonb;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT coalesce(jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO rows FROM (
    SELECT id, period, entry_type, kind, label, credits, balance_after, request_id, reverses_id, metadata, created_at
      FROM public.credit_ledger WHERE user_id = _user_id
     ORDER BY created_at DESC LIMIT greatest(1, least(coalesce(_limit,50), 200))
  ) t;
  RETURN rows;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_credit_ledger(uuid,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_credit_ledger(uuid,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_credit_incidents(_limit int DEFAULT 50, _only_open boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); rows jsonb;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT coalesce(jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO rows FROM (
    SELECT i.id, i.user_id, u.email::text AS email, i.kind::text AS kind, i.severity, i.surface,
           i.message, i.request_id, i.metadata, i.resolved_at, i.created_at
      FROM public.credit_incidents i
      LEFT JOIN auth.users u ON u.id = i.user_id
     WHERE (NOT _only_open) OR i.resolved_at IS NULL
     ORDER BY i.created_at DESC LIMIT greatest(1, least(coalesce(_limit,50), 200))
  ) t;
  RETURN rows;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_credit_incidents(int,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_credit_incidents(int,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_credit_audit(_limit int DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); rows jsonb;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT coalesce(jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO rows FROM (
    SELECT a.id, a.actor_id, actor.email::text AS actor_email, a.target_user_id, target.email::text AS target_email,
           a.action, a.amount, a.reason, a.entry_id, a.before_snapshot, a.after_snapshot, a.created_at
      FROM public.credit_admin_audit a
      LEFT JOIN auth.users actor ON actor.id = a.actor_id
      LEFT JOIN auth.users target ON target.id = a.target_user_id
     ORDER BY a.created_at DESC LIMIT greatest(1, least(coalesce(_limit,50), 200))
  ) t;
  RETURN rows;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_credit_audit(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_credit_audit(int) TO authenticated;

-- 6. Admin mutations (top up / decrement / refund) with audit trail
CREATE OR REPLACE FUNCTION public.admin_account_state(_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('plan', plan, 'period', period, 'included', included,
                            'topups', topups, 'used', used,
                            'remaining', included + topups - used)
    FROM public.credit_accounts WHERE user_id = _user_id
$$;
REVOKE EXECUTE ON FUNCTION public.admin_account_state(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_account_state(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_user_credits(
  _user_id uuid, _amount numeric, _label text,
  _kind text DEFAULT 'topup', _reason text DEFAULT 'admin adjustment')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  acct public.credit_accounts;
  before_state jsonb;
  after_state jsonb;
  entry public.credit_ledger;
  amt numeric := _amount;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _kind NOT IN ('topup','adjustment','decrement') THEN RAISE EXCEPTION 'Invalid kind'; END IF;
  IF amt IS NULL OR amt = 0 THEN RAISE EXCEPTION 'Amount must be non-zero'; END IF;

  acct := public.ensure_credit_account(_user_id, NULL);
  before_state := public.admin_account_state(_user_id);

  IF _kind = 'topup' THEN
    UPDATE public.credit_accounts SET topups = topups + abs(amt)::int WHERE user_id = _user_id RETURNING * INTO acct;
    INSERT INTO public.credit_ledger (user_id, period, entry_type, kind, label, credits, balance_after, metadata)
    VALUES (_user_id, acct.period, 'topup', 'admin_topup', _label, -abs(amt),
            acct.included + acct.topups - acct.used,
            jsonb_build_object('actor_id', uid, 'reason', _reason))
    RETURNING * INTO entry;
  ELSIF _kind = 'decrement' THEN
    UPDATE public.credit_accounts SET used = used + abs(amt) WHERE user_id = _user_id RETURNING * INTO acct;
    INSERT INTO public.credit_ledger (user_id, period, entry_type, kind, label, credits, balance_after, metadata)
    VALUES (_user_id, acct.period, 'adjustment', 'admin_decrement', _label, abs(amt),
            acct.included + acct.topups - acct.used,
            jsonb_build_object('actor_id', uid, 'reason', _reason))
    RETURNING * INTO entry;
  ELSE
    UPDATE public.credit_accounts SET used = greatest(0, used - abs(amt)) WHERE user_id = _user_id RETURNING * INTO acct;
    INSERT INTO public.credit_ledger (user_id, period, entry_type, kind, label, credits, balance_after, metadata)
    VALUES (_user_id, acct.period, 'adjustment', 'admin_credit', _label, -abs(amt),
            acct.included + acct.topups - acct.used,
            jsonb_build_object('actor_id', uid, 'reason', _reason))
    RETURNING * INTO entry;
  END IF;

  after_state := public.admin_account_state(_user_id);

  INSERT INTO public.credit_admin_audit (actor_id, target_user_id, action, amount, reason, entry_id, before_snapshot, after_snapshot)
  VALUES (uid, _user_id, _kind, abs(amt), coalesce(_reason,'admin adjustment'), entry.id, before_state, after_state);

  RETURN jsonb_build_object('ok', true, 'entry_id', entry.id, 'before', before_state, 'after', after_state);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_user_credits(uuid,numeric,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_user_credits(uuid,numeric,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_refund_entry(
  _entry_id uuid, _reason text DEFAULT 'admin refund', _amount numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  src public.credit_ledger;
  acct public.credit_accounts;
  before_state jsonb;
  after_state jsonb;
  already numeric;
  amt numeric;
  entry public.credit_ledger;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT * INTO src FROM public.credit_ledger WHERE id = _entry_id;
  IF NOT FOUND OR src.entry_type <> 'charge' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'entry_not_found');
  END IF;

  SELECT coalesce(abs(sum(credits)),0) INTO already FROM public.credit_ledger WHERE reverses_id = src.id;
  amt := least(coalesce(_amount, src.credits - already), src.credits - already);
  IF amt <= 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'already_refunded'); END IF;

  before_state := public.admin_account_state(src.user_id);

  UPDATE public.credit_accounts SET used = greatest(0, used - amt) WHERE user_id = src.user_id RETURNING * INTO acct;

  INSERT INTO public.credit_ledger (user_id, period, entry_type, kind, label, credits, balance_after, reverses_id, metadata)
  VALUES (src.user_id, acct.period, 'refund', src.kind, format('Refund · %s', src.label), -amt,
          acct.included + acct.topups - acct.used, src.id,
          jsonb_build_object('actor_id', uid, 'reason', _reason))
  RETURNING * INTO entry;

  after_state := public.admin_account_state(src.user_id);

  INSERT INTO public.credit_admin_audit (actor_id, target_user_id, action, amount, reason, entry_id, before_snapshot, after_snapshot)
  VALUES (uid, src.user_id, 'refund', amt, coalesce(_reason,'admin refund'), entry.id, before_state, after_state);

  RETURN jsonb_build_object('ok', true, 'entry_id', entry.id, 'refunded', amt, 'before', before_state, 'after', after_state);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_refund_entry(uuid,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_refund_entry(uuid,text,numeric) TO authenticated;

-- 7. Let a user check whether they are an admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(public.has_role(auth.uid(), 'admin'), false)
$$;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;