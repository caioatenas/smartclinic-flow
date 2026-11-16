CREATE TABLE public.referrals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ticket_id uuid NOT NULL REFERENCES public.tickets(id),
 doctor_id uuid NOT NULL REFERENCES public.doctors(id),
 office_id uuid NOT NULL REFERENCES public.offices(id),
 reason text NOT NULL,
 outcome text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando','em_atendimento','concluido')),
 created_at timestamptz NOT NULL DEFAULT now(),
 called_at timestamptz,
 completed_at timestamptz,
 handled_by uuid
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_read ON public.referrals FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'assistant') OR doctor_id=public.own_doctor());
CREATE UNIQUE INDEX referral_one_active_ticket ON public.referrals(ticket_id) WHERE status <> 'concluido';
CREATE UNIQUE INDEX referral_one_active_office ON public.referrals(office_id) WHERE status = 'em_atendimento';
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
CREATE FUNCTION public.create_referral(p_ticket_id uuid,p_office_id uuid,p_reason text,p_complaint text DEFAULT '',p_observations text DEFAULT '',p_diagnosis text DEFAULT '') RETURNS public.referrals LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.tickets; r public.referrals;
BEGIN
 SELECT * INTO t FROM public.tickets WHERE id=p_ticket_id FOR UPDATE;
 IF NOT FOUND OR t.status <> 'em_atendimento_medico' OR NOT (public.has_role(auth.uid(),'admin') OR t.doctor_id=public.own_doctor()) THEN RAISE EXCEPTION 'Paciente indisponível para encaminhamento.'; END IF;
 IF length(trim(coalesce(p_reason,'')))=0 OR length(p_reason)>2000 THEN RAISE EXCEPTION 'Informe o motivo do encaminhamento (até 2000 caracteres).'; END IF;
 IF p_office_id=t.office_id OR NOT EXISTS(SELECT 1 FROM public.offices WHERE id=p_office_id AND active) THEN RAISE EXCEPTION 'Selecione outra sala ativa.'; END IF;
 INSERT INTO public.referrals(ticket_id,doctor_id,office_id,reason) VALUES(t.id,t.doctor_id,p_office_id,trim(p_reason)) RETURNING * INTO r;
 IF length(trim(p_complaint||p_observations||p_diagnosis))>0 THEN INSERT INTO public.medical_records(ticket_id,complaint,observations,diagnosis) VALUES(t.id,p_complaint,p_observations,p_diagnosis); END IF;
 UPDATE public.tickets SET status='aguardando_sala',office_id=p_office_id,office_name=(SELECT name FROM public.offices WHERE id=p_office_id) WHERE id=t.id;
 RETURN r;
END $$;
CREATE FUNCTION public.call_next_room(p_office_id uuid) RETURNS public.referrals LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.referrals;
BEGIN
 IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'assistant') OR public.has_role(auth.uid(),'doctor')) THEN RAISE EXCEPTION 'Acesso não permitido.'; END IF;
 PERFORM 1 FROM public.offices WHERE id=p_office_id AND active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala inativa ou inexistente.'; END IF;
 IF EXISTS(SELECT 1 FROM public.referrals WHERE office_id=p_office_id AND status='em_atendimento') OR EXISTS(SELECT 1 FROM public.tickets WHERE office_id=p_office_id AND status='em_atendimento_medico') THEN RAISE EXCEPTION 'A sala já tem um paciente em atendimento.'; END IF;
 SELECT f.* INTO r FROM public.referrals f JOIN public.tickets t ON t.id=f.ticket_id WHERE f.office_id=p_office_id AND f.status='aguardando' ORDER BY CASE t.priority WHEN 'priority' THEN 0 WHEN 'agendado' THEN 1 ELSE 2 END,f.created_at FOR UPDATE OF f SKIP LOCKED LIMIT 1;
 IF NOT FOUND THEN RETURN NULL; END IF;
 UPDATE public.referrals SET status='em_atendimento',called_at=now(),handled_by=auth.uid() WHERE id=r.id RETURNING * INTO r;
 UPDATE public.tickets SET status='em_atendimento_sala',called_at=r.called_at,office_id=p_office_id,office_name=(SELECT name FROM public.offices WHERE id=p_office_id) WHERE id=r.ticket_id AND status='aguardando_sala';
 IF NOT FOUND THEN RAISE EXCEPTION 'Paciente indisponível.'; END IF;
 RETURN r;
END $$;
CREATE FUNCTION public.complete_referral(p_id uuid,p_outcome text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.referrals;
BEGIN
 SELECT * INTO r FROM public.referrals WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR r.status<>'em_atendimento' OR NOT (public.has_role(auth.uid(),'admin') OR (r.handled_by=auth.uid() AND (public.has_role(auth.uid(),'assistant') OR public.has_role(auth.uid(),'doctor')))) THEN RAISE EXCEPTION 'Apenas o responsável pode concluir este encaminhamento.'; END IF;
 IF length(trim(coalesce(p_outcome,'')))=0 OR length(p_outcome)>4000 THEN RAISE EXCEPTION 'Registre a conclusão (até 4000 caracteres).'; END IF;
 UPDATE public.referrals SET status='concluido',outcome=trim(p_outcome),completed_at=now() WHERE id=r.id;
 UPDATE public.tickets SET status='aguardando_medico',doctor_id=r.doctor_id,office_id=NULL,office_name=NULL WHERE id=r.ticket_id AND status='em_atendimento_sala';
 IF NOT FOUND THEN RAISE EXCEPTION 'Paciente indisponível.'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.create_referral(uuid,uuid,text,text,text,text),public.call_next_room(uuid),public.complete_referral(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_referral(uuid,uuid,text,text,text,text),public.call_next_room(uuid),public.complete_referral(uuid,text) TO authenticated;
CREATE FUNCTION public.guard_referral_ticket() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status AND EXISTS(SELECT 1 FROM public.referrals WHERE ticket_id=OLD.id AND status<>'concluido') AND NEW.status NOT IN ('aguardando_sala','em_atendimento_sala') THEN RAISE EXCEPTION 'Conclua o encaminhamento antes de continuar a consulta.'; END IF;
 IF NEW.status='em_atendimento_medico' THEN
 PERFORM 1 FROM public.offices WHERE id=NEW.office_id AND active FOR UPDATE;
 IF NOT FOUND OR EXISTS(SELECT 1 FROM public.referrals WHERE office_id=NEW.office_id AND status='em_atendimento') THEN RAISE EXCEPTION 'Consultório indisponível.'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_referral_ticket BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.guard_referral_ticket();