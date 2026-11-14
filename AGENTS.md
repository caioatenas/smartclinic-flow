# AGENTS.md

## Architecture rules

- Clinic state (tickets, appointments, doctors, offices, users, queue rules) lives in Lovable Cloud tables and is mirrored to every screen through one realtime channel per page; do not reintroduce localStorage or BroadcastChannel as the source of truth, because separate screens and machines must see the same queue.
- Queue operations that two screens could race — ticket code generation and "call next" at reception or at the doctor — run as atomic `SECURITY DEFINER` SQL functions (`next_ticket_code`, `call_next_reception`, `call_next_doctor`) instead of read-then-write in the client, because two operators clicking at once must never be handed the same patient.
- Every new `public` table needs `GRANT`s plus an RLS policy in the same migration, and gets added to the `supabase_realtime` publication if any screen must react to it live.

- Staff authentication uses Cloud Auth; authorization comes from protected user_roles plus active profiles, never browser storage or legacy system_users. Staff invitations are managed through admin-validated RPCs and become access only after email confirmation.
- Public TV and kiosk read only queue_display (no CPF, phone, prescriptions or records); the kiosk creates tickets through a limited RPC. Private operational tables are staff-only, and clinical writes and doctor calls require the linked physician.
