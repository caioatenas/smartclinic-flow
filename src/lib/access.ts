export type StaffRole = 'admin' | 'doctor' | 'receptionist' | 'assistant';
export function canAccess(role: StaffRole | null, path: string, doctorId?: string | null) {
  if (['/', '/login', '/reset-password', '/panel', '/kiosk'].includes(path)) return true;
  if (!role) return false;
  if (role === 'admin') return true;
  if (role === 'doctor') return path === '/doctor' || (!!doctorId && path === `/doctor/${doctorId}`);
  return path === (role === 'receptionist' ? '/reception' : '/assistant');
}