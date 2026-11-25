// Países para envíos internacionales (DHL). Perú no aparece: los pedidos nacionales
// se eligen como Lima o Provincias. `americas` decide el 8 % de PayPal (políticas §4B).
export const COUNTRIES = [
  // Destinos DHL comprobados (políticas §5D)
  { code: 'AR', name: 'Argentina', americas: true },
  { code: 'BO', name: 'Bolivia', americas: true },
  { code: 'BR', name: 'Brasil', americas: true },
  { code: 'CL', name: 'Chile', americas: true },
  { code: 'CR', name: 'Costa Rica', americas: true },
  { code: 'EC', name: 'Ecuador', americas: true },
  { code: 'SV', name: 'El Salvador', americas: true },
  { code: 'US', name: 'Estados Unidos', americas: true },
  { code: 'MX', name: 'México', americas: true },
  { code: 'ES', name: 'España', americas: false },
  { code: 'FR', name: 'Francia', americas: false },
  { code: 'IT', name: 'Italia', americas: false },
  // Resto de América
  { code: 'CA', name: 'Canadá', americas: true },
  { code: 'CO', name: 'Colombia', americas: true },
  { code: 'CU', name: 'Cuba', americas: true },
  { code: 'DO', name: 'República Dominicana', americas: true },
  { code: 'GT', name: 'Guatemala', americas: true },
  { code: 'HN', name: 'Honduras', americas: true },
  { code: 'NI', name: 'Nicaragua', americas: true },
  { code: 'PA', name: 'Panamá', americas: true },
  { code: 'PY', name: 'Paraguay', americas: true },
  { code: 'PR', name: 'Puerto Rico', americas: true },
  { code: 'UY', name: 'Uruguay', americas: true },
  { code: 'VE', name: 'Venezuela', americas: true },
  // Otros frecuentes
  { code: 'DE', name: 'Alemania', americas: false },
  { code: 'JP', name: 'Japón', americas: false },
  { code: 'GB', name: 'Reino Unido', americas: false },
  { code: 'OTRO', name: 'Otro país', americas: false },
]

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]))

export function isAmericas(code) {
  return BY_CODE.get(code)?.americas === true
}

export function countryName(code) {
  return BY_CODE.get(code)?.name ?? code ?? ''
}
