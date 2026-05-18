const KEY = import.meta.env.VITE_POSITIONSTACK_KEY

// Busca sugerencias de direcciones reales dado un texto
export async function buscarDirecciones(texto: string) {
  const url = `http://api.positionstack.com/v1/forward?access_key=${KEY}&query=${encodeURIComponent(texto)}&limit=4&output=json`
  const res = await fetch(url)
  const data = await res.json()
  return data.data ?? []
}
