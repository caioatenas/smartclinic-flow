export const onlyDigits = (v: string) => v.replace(/\D/g, '');

/** Formats up to 11 digits as 000.000.000-00 while typing. */
export function formatCpf(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export const isCompleteCpf = (v: string) => onlyDigits(v).length === 11;

/** Same CPF regardless of punctuation. */
export const sameCpf = (a?: string, b?: string) => !!a && !!b && onlyDigits(a) === onlyDigits(b);
