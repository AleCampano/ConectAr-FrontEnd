export async function buscarDirecciones(texto: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto)}&format=json&limit=5&countrycodes=ar&accept-language=es&addressdetails=1`
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'es' }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.map((item: any) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }))
  } catch {
    return []
  }
}
