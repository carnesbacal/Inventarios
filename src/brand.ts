// Tokens de marca centralizados (nombre, version, firma del desarrollador).
// Sube tu version aqui en cada release.
export const BRAND = {
  company: 'Carnes Bacal',
  app: 'Inventarios',
  tagline: 'Conteos y traspasos de piso',
  // Siglas del sistema (estilo de la familia de apps de la empresa).
  acronym: 'SIGIA',
  fullName: 'Sistema Integral de Gestion de Inventarios y Almacenes',
  system: 'SIGIA · Sistema interno',
  version: 'v1.0.0',
  year: 2026,
  // Firma estilo etiqueta HTML: <PARIOS> abre (quien empezo el codigo),
  // </LFRC> cierra (quien lo termino).
  devOpener: 'PARIOS',
  devCloser: 'LFRC',
} as const

/** Firma del desarrollador: <PARIOS></LFRC>. */
export const DEV_SIGNATURE = `<${BRAND.devOpener}></${BRAND.devCloser}>`
