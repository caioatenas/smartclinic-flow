CREATE OR REPLACE FUNCTION public.create_referral(p_ticket_id uuid,p_office_id uuid,p_reason text,p_complaint text DEFAULT '',p_observations text DEFAULT '',p_diagnosis text DEFAULT '') RETURNS public.referrals LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.tickets; r public.referrals;
BEGIN
 SELECT * INTO t FROM public.tickets WHERE id=p_ticket_id FOR UPDATE;
 IF NOT FOUND OR t.status <> 'em_atendimento_medico' OR NOT coalesce((public.has_role(auth.uid(),'admin') OR t.doctor_id=public.own_doctor()),false) THEN RAISE EXCEPTION 'Paciente indisponível para encaminhamento.'; END IF;
 IF length(trim(coalesce(p_reason,'')))=0 OR length(p_reason)>2000 THEN RAISE EXCEPTION 'Informe o motivo do encaminhamento (até 2000 caracteres).'; END IF;
 IF p_office_id=t.office_id OR NOT EXISTS(SELECT 1 FROM public.offices WHERE id=p_office_id AND active) THEN RAISE EXCEPTION 'Selecione outra sala ativa.'; END IF;
 INSERT INTO public.referrals(ticket_id,doctor_id,office_id,reason) VALUES(t.id,t.doctor_id,p_office_id,trim(p_reason)) RETURNING * INTO r;
 IF length(trim(coalesce(p_complaint,'')||coalesce(p_observations,'')||coalesce(p_diagnosis,'')))>0 THEN INSERT INTO public.medical_records(ticket_id,complaint,observations,diagnosis) VALUES(t.id,coalesce(p_complaint,''),coalesce(p_observations,''),coalesce(p_diagnosis,'')); END IF;
 UPDATE public.tickets SET status='aguardando_sala',office_id=p_office_id,office_name=(SELECT name FROM public.offices WHERE id=p_office_id) WHERE id=t.id;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.guard_referral_ticket() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.referrals WHERE ticket_id=OLD.id AND status<>'concluido') AND (NEW.status NOT IN ('aguardando_sala','em_atendimento_sala') OR NEW.doctor_id IS DISTINCT FROM OLD.doctor_id) THEN RAISE EXCEPTION 'Conclua o encaminhamento antes de continuar a consulta.'; END IF;
 IF NEW.status IN ('aguardando_sala','em_atendimento_sala') AND NOT EXISTS(SELECT 1 FROM public.referrals WHERE ticket_id=NEW.id AND doctor_id=NEW.doctor_id AND office_id=NEW.office_id AND status=CASE NEW.status WHEN 'aguardando_sala' THEN 'aguardando' ELSE 'em_atendimento' END) THEN RAISE EXCEPTION 'Encaminhamento inconsistente.'; END IF;
 IF NEW.status='em_atendimento_medico' THEN
 PERFORM 1 FROM public.offices WHERE id=NEW.office_id AND active FOR UPDATE;
 IF NOT FOUND OR EXISTS(SELECT 1 FROM public.referrals WHERE office_id=NEW.office_id AND status='em_atendimento') OR EXISTS(SELECT 1 FROM public.tickets WHERE office_id=NEW.office_id AND status='em_atendimento_medico' AND id<>NEW.id) THEN RAISE EXCEPTION 'Consultório indisponível.'; END IF;
 END IF;
 RETURN NEW;
END $$;