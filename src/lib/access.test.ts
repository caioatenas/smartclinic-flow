import { describe, it, expect } from 'vitest';
import { canAccess } from './access';
describe('staff permissions', () => {
  it('allows staff to view beds but rejects anonymous access', () => {
    for (const role of ['admin','assistant','doctor','receptionist'] as const) expect(canAccess(role,'/beds')).toBe(true);
    expect(canAccess(null,'/beds')).toBe(false);
  });
  it('keeps TV and kiosk public but blocks staff pages', () => {
    expect(canAccess(null, '/panel')).toBe(true);
    expect(canAccess(null, '/kiosk')).toBe(true);
    expect(canAccess(null, '/admin')).toBe(false);
  });
  it('limits reception to reception', () => {
    expect(canAccess('receptionist', '/reception')).toBe(true);
    expect(canAccess('receptionist', '/doctor')).toBe(false);
    expect(canAccess('receptionist', '/admin')).toBe(false);
  });
  it('limits assistants to their screen and referral rooms', () => {
    expect(canAccess('assistant', '/assistant')).toBe(true);
    expect(canAccess('assistant', '/reception')).toBe(false);
    expect(canAccess('assistant', '/rooms/two')).toBe(true);
  });
  it('limits a doctor to their linked identity', () => {
    expect(canAccess('doctor', '/doctor/one', 'one')).toBe(true);
    expect(canAccess('doctor', '/doctor/two', 'one')).toBe(false);
    expect(canAccess('doctor', '/admin', 'one')).toBe(false);
  });
  it('allows administrators all staff screens', () => {
    for (const path of ['/admin', '/reception', '/assistant', '/doctor/two']) expect(canAccess('admin', path)).toBe(true);
  });
  it('allows doctors and admins into rooms but rejects reception and public access', () => {
    expect(canAccess('doctor', '/rooms/two', 'one')).toBe(true);
    expect(canAccess('admin', '/rooms/two')).toBe(true);
    expect(canAccess('receptionist', '/rooms/two')).toBe(false);
    expect(canAccess(null, '/rooms')).toBe(false);
  });
});