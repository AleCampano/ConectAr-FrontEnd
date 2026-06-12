export async function buscarDirecciones(texto: string) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(texto)}&limit=5&lang=es&bbox=-73.5,-55.1,-53.6,-21.8`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.features.map((f: any) => {
      const p = f.properties
      const partes = [p.name, p.street, p.city, p.state, p.country].filter(Boolean)
      return { label: partes.join(', ') }
    })
  } catch {
    return []
  }
}
