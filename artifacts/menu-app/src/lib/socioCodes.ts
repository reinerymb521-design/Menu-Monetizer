export const SOCIO_CODES: Record<string, { nombre: string; usado: boolean }> = {
  "AV-SOCIO-K7X26": { nombre: "Socio #1", usado: false },
  "AV-SOCIO-P3M84": { nombre: "Socio #2", usado: false },
  "AV-SOCIO-R8N51": { nombre: "Socio #3", usado: false },
  "AV-SOCIO-T5Q93": { nombre: "Socio #4", usado: false },
  "AV-SOCIO-W2J47": { nombre: "Socio #5", usado: false },
};

export function isValidSocioCode(code: string) {
  return code.trim().toUpperCase() in SOCIO_CODES;
}
