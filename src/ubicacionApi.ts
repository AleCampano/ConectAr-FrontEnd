export async function buscarDirecciones(texto: string) {
  // /nominatim es un proxy local que evita el bloqueo CORS de Nominatim
  const url = `/nominatim/search?q=${encodeURIComponent(texto)}&format=json&limit=5&addressdetails=1&countrycodes=ar&accept-language=es`
  const res = await fetch(url)
  const data = await res.json()
  return data.map((d: any) => ({ label: d.display_name }))
}
