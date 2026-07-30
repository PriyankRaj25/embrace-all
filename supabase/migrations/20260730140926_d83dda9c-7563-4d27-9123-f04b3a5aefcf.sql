
REVOKE EXECUTE ON FUNCTION public.credit_snapshot(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.consume_credits(text, text, numeric, text, jsonb, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refund_credits(uuid, text, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.adjust_credits(numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_credit_account(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_plan_config(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.credit_cost(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.credit_snapshot(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credits(text, text, numeric, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_credits(numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_plan_config(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_cost(text) TO authenticated;
