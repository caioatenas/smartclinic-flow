import { describe, it, expect } from 'vitest';
import { canAccess } from './access';
describe('staff permissions', () => {
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
  it('limits assistants to their read-only screen', () => {
    expect(canAccess('assistant', '/assistant')).toBe(true);
    expect(canAccess('assistant', '/reception')).toBe(false);
  });
  it('limits a doctor to their linked identity', () => {
    expect(canAccess('doctor', '/doctor/one', 'one')).toBe(true);
    expect(canAccess('doctor', '/doctor/two', 'one')).toBe(false);
    expect(canAccess('doctor', '/admin', 'one')).toBe(false);
  });
  it('allows administrators all staff screens', () => {
    for (const path of ['/admin', '/reception', '/assistant', '/doctor/two']) expect(canAccess('admin', path)).toBe(true);
  });
});