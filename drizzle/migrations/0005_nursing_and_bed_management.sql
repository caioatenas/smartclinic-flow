ALTER TABLE public.offices ADD COLUMN care_type text NOT NULL DEFAULT 'general' CHECK(care_type IN ('general','medication','triage'));
CREATE TABLE public.beds(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 100),office_id uuid NOT NULL REFERENCES public.offices(id),availability text NOT NULL DEFAULT 'disponivel' CHECK(availability IN ('disponivel','higienizacao','bloqueado')),ticket_id uuid REFERENCES public.tickets(id),occupied_at timestamptz);
GRANT SELECT ON public.beds TO authenticated; GRANT ALL ON public.beds TO service_role;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY beds_read ON public.beds FOR SELECT TO authenticated USING(public.is_clinic_staff());
CREATE UNIQUE INDEX one_bed_per_patient ON public.beds(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE TABLE public.bed_movements(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ticket_id uuid NOT NULL REFERENCES public.tickets(id),from_bed_id uuid REFERENCES public.beds(id),to_bed_id uuid REFERENCES public.beds(id),reason text NOT NULL,performed_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.bed_movements TO authenticated; GRANT ALL ON public.bed_movements TO service_role;
ALTER TABLE public.bed_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY movements_read ON public.bed_movements FOR SELECT TO authenticated USING(public.is_clinic_staff());
CREATE TABLE public.medication_administrations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),referral_id uuid NOT NULL REFERENCES public.referrals(id),medication text NOT NULL,dose text NOT NULL,route text NOT NULL,administered_at timestamptz NOT NULL,notes text NOT NULL DEFAULT '',recorded_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.medication_administrations TO authenticated; GRANT ALL ON public.medication_administrations TO service_role;
ALTER TABLE public.medication_administrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY medication_read ON public.medication_administrations FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.referrals r WHERE r.id=referral_id AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'assistant') OR r.doctor_id=public.own_doctor())));
CREATE TABLE public.nursing_triages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),referral_id uuid NOT NULL REFERENCES public.referrals(id),systolic numeric NOT NULL,diastolic numeric NOT NULL,pulse numeric NOT NULL,respiratory_rate numeric NOT NULL,temperature numeric NOT NULL,oxygen numeric NOT NULL,pain numeric NOT NULL,risk text NOT NULL CHECK(risk IN ('sem_alerta','atencao','alto')),alerts text NOT NULL DEFAULT '',notes text NOT NULL DEFAULT '',measured_at timestamptz NOT NULL,recorded_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.nursing_triages TO authenticated; GRANT ALL ON public.nursing_triages TO service_role;
ALTER TABLE public.nursing_triages ENABLE ROW LEVEL SECURITY;
CREATE POLICY triage_read ON public.nursing_triages FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.referrals r WHERE r.id=referral_id AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'assistant') OR r.doctor_id=public.own_doctor())));
ALTER PUBLICATION supabase_realtime ADD TABLE public.beds,public.bed_movements,public.medication_administrations,public.nursing_triages;
CREATE FUNCTION public.manage_bed(p_id uuid,p_name text,p_office_id uuid,p_availability text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Somente administrador gerencia leitos.'; END IF;
 IF length(trim(coalesce(p_name,''))) NOT BETWEEN 1 AND 100 OR p_availability NOT IN ('disponivel','higienizacao','bloqueado') OR NOT EXISTS(SELECT 1 FROM public.offices WHERE id=p_office_id AND active) THEN RAISE EXCEPTION 'Dados de leito inválidos.'; END IF;
 IF p_id IS NULL THEN INSERT INTO public.beds(name,office_id,availability) VALUES(trim(p_name),p_office_id,p_availability); ELSE
 UPDATE public.beds SET name=trim(p_name),office_id=p_office_id,availability=p_availability WHERE id=p_id AND ticket_id IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Leito ocupado ou inexistente.'; END IF; END IF; END $$;
CREATE FUNCTION public.move_patient_bed(p_ticket_id uuid,p_to_bed_id uuid,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE old_bed public.beds; dest public.beds; BEGIN
 IF NOT(public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'assistant')) THEN RAISE EXCEPTION 'Acesso não permitido.'; END IF;
 PERFORM pg_advisory_xact_lock(836215);
 PERFORM 1 FROM public.tickets WHERE id=p_ticket_id AND status IN ('aguardando_sala','em_atendimento_sala') FOR UPDATE;
 IF NOT FOUND OR length(trim(coalesce(p_reason,''))) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Paciente ou motivo inválido.'; END IF;
 SELECT * INTO old_bed FROM public.beds WHERE ticket_id=p_ticket_id FOR UPDATE;
 IF p_to_bed_id IS NOT NULL THEN
 SELECT b.* INTO dest FROM public.beds b JOIN public.offices o ON o.id=b.office_id WHERE b.id=p_to_bed_id AND o.active FOR UPDATE OF b;
 IF NOT FOUND OR dest.ticket_id IS NOT NULL OR dest.availability<>'disponivel' THEN RAISE EXCEPTION 'Leito indisponível.'; END IF;
 ELSIF old_bed.id IS NULL THEN RAISE EXCEPTION 'Paciente não ocupa leito.'; END IF;
 UPDATE public.beds SET ticket_id=NULL,occupied_at=NULL,availability='higienizacao' WHERE id=old_bed.id;
 IF p_to_bed_id IS NOT NULL THEN UPDATE public.beds SET ticket_id=p_ticket_id,occupied_at=now() WHERE id=p_to_bed_id; END IF;
 INSERT INTO public.bed_movements(ticket_id,from_bed_id,to_bed_id,reason,performed_by) VALUES(p_ticket_id,old_bed.id,p_to_bed_id,trim(p_reason),auth.uid()); END $$;
CREATE FUNCTION public.record_nursing_care(p_referral_id uuid,p_kind text,p_data jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r public.referrals; measured timestamptz; BEGIN
 SELECT * INTO r FROM public.referrals WHERE id=p_referral_id FOR UPDATE;
 IF NOT FOUND OR r.status<>'em_atendimento' OR NOT coalesce((public.has_role(auth.uid(),'admin') OR (r.handled_by=auth.uid() AND (public.has_role(auth.uid(),'assistant') OR public.has_role(auth.uid(),'doctor')))),false) THEN RAISE EXCEPTION 'Apenas responsável pelo atendimento registra cuidados.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.offices WHERE id=r.office_id AND care_type=p_kind) THEN RAISE EXCEPTION 'Tipo de sala incompatível.'; END IF;
 measured=(p_data->>'time')::timestamptz;
 IF measured IS NULL OR measured>now() OR measured<r.called_at THEN RAISE EXCEPTION 'Horário deve estar entre a chamada e o momento atual.'; END IF;
 IF length(coalesce(p_data->>'notes',''))>4000 THEN RAISE EXCEPTION 'Observações excedem o limite.'; END IF;
 IF p_kind='medication' THEN
 IF length(trim(coalesce(p_data->>'medication',''))) NOT BETWEEN 1 AND 200 OR length(trim(coalesce(p_data->>'dose',''))) NOT BETWEEN 1 AND 100 OR length(trim(coalesce(p_data->>'route',''))) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Informe medicamento, dose e via.'; END IF;
 INSERT INTO public.medication_administrations(referral_id,medication,dose,route,administered_at,notes,recorded_by) VALUES(r.id,trim(p_data->>'medication'),trim(p_data->>'dose'),trim(p_data->>'route'),measured,coalesce(p_data->>'notes',''),auth.uid());
 ELSIF p_kind='triage' THEN
 IF NOT (p_data ?& ARRAY['systolic','diastolic','pulse','respiratory_rate','temperature','oxygen','pain','risk']) THEN RAISE EXCEPTION 'Informe todos os sinais vitais.'; END IF;
 IF (p_data->>'systolic')::numeric NOT BETWEEN 1 AND 400 OR (p_data->>'diastolic')::numeric NOT BETWEEN 1 AND 300 OR (p_data->>'pulse')::numeric NOT BETWEEN 1 AND 350 OR (p_data->>'respiratory_rate')::numeric NOT BETWEEN 1 AND 150 OR (p_data->>'temperature')::numeric NOT BETWEEN 20 AND 50 OR (p_data->>'oxygen')::numeric NOT BETWEEN 0 AND 100 OR (p_data->>'pain')::numeric NOT BETWEEN 0 AND 10 OR p_data->>'risk' NOT IN ('sem_alerta','atencao','alto') THEN RAISE EXCEPTION 'Sinais vitais ou classificação inválidos.'; END IF;
 IF p_data->>'risk'<>'sem_alerta' AND length(trim(coalesce(p_data->>'alerts','')))=0 THEN RAISE EXCEPTION 'Descreva o alerta de risco.'; END IF;
 INSERT INTO public.nursing_triages(referral_id,systolic,diastolic,pulse,respiratory_rate,temperature,oxygen,pain,risk,alerts,notes,measured_at,recorded_by) VALUES(r.id,(p_data->>'systolic')::numeric,(p_data->>'diastolic')::numeric,(p_data->>'pulse')::numeric,(p_data->>'respiratory_rate')::numeric,(p_data->>'temperature')::numeric,(p_data->>'oxygen')::numeric,(p_data->>'pain')::numeric,p_data->>'risk',coalesce(p_data->>'alerts',''),coalesce(p_data->>'notes',''),measured,auth.uid());
 ELSE RAISE EXCEPTION 'Tipo de registro inválido.'; END IF; END $$;
CREATE FUNCTION public.finish_nursing_care() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE kind text; b public.beds; BEGIN
 IF NEW.status='concluido' AND OLD.status<>'concluido' THEN
 SELECT care_type INTO kind FROM public.offices WHERE id=NEW.office_id;
 IF kind='medication' AND NOT EXISTS(SELECT 1 FROM public.medication_administrations WHERE referral_id=NEW.id) THEN RAISE EXCEPTION 'Registre a medicação administrada antes de concluir.'; END IF;
 IF kind='triage' AND NOT EXISTS(SELECT 1 FROM public.nursing_triages WHERE referral_id=NEW.id) THEN RAISE EXCEPTION 'Registre a triagem antes de concluir.'; END IF;
 PERFORM pg_advisory_xact_lock(836215);
 SELECT * INTO b FROM public.beds WHERE ticket_id=NEW.ticket_id FOR UPDATE;
 IF FOUND THEN UPDATE public.beds SET ticket_id=NULL,occupied_at=NULL,availability='higienizacao' WHERE id=b.id; INSERT INTO public.bed_movements(ticket_id,from_bed_id,reason,performed_by) VALUES(NEW.ticket_id,b.id,'Conclusão do atendimento na sala',auth.uid()); END IF;
 END IF; RETURN NEW; END $$;
CREATE TRIGGER finish_nursing_care BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.finish_nursing_care();
REVOKE ALL ON FUNCTION public.manage_bed(uuid,text,uuid,text),public.move_patient_bed(uuid,uuid,text),public.record_nursing_care(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_bed(uuid,text,uuid,text),public.move_patient_bed(uuid,uuid,text),public.record_nursing_care(uuid,text,jsonb) TO authenticated;