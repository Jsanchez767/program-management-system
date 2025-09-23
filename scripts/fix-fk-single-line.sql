SELECT exec_sql('ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS programs_organization_id_fkey;');
SELECT exec_sql('ALTER TABLE public.activities ADD CONSTRAINT activities_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;');
SELECT exec_sql('ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS programs_staff_id_fkey;');
SELECT exec_sql('ALTER TABLE public.activities ADD CONSTRAINT activities_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES auth.users(id) ON DELETE SET NULL;');