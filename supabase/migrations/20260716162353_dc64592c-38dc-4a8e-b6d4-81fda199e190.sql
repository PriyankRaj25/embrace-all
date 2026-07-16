
-- Fix search_path warnings and lock down SECURITY DEFINER execute privileges
ALTER FUNCTION public.tg_touch_updated_at() SET search_path = public;

-- has_role: only authenticated should call it via policies
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- handle_new_user: only triggered internally by auth
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
