import { describe, it, expect } from 'vitest';
import { formatCpf, isCompleteCpf, sameCpf } from './cpf';
describe('cpf', () => {
  it('formats 11 digits', () => expect(formatCpf('12345678901')).toBe('123.456.789-01'));
  it('caps at 11 digits', () => expect(formatCpf('123456789012345')).toBe('123.456.789-01'));
  it('detects complete cpf', () => { expect(isCompleteCpf('123.456.789-01')).toBe(true); expect(isCompleteCpf('1234')).toBe(false); });
  it('matches ignoring punctuation', () => expect(sameCpf('123.456.789-01', '12345678901')).toBe(true));
});
