import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Mueve el mapa cuando cambia la posición
function Centrar({ posicion }: { posicion: [number, number] }) {
  const mapa = useMap()
  useEffect(() => { mapa.setView(posicion, 15) }, [posicion])
  return null
}

type Props = {
  posicion: [number, number] | null
}

function MapaPicker({ posicion }: Props) {
  const centro: [number, number] = posicion ?? [-34.6037, -58.3816]

  return (
    <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
      <MapContainer center={centro} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {posicion && <Centrar posicion={posicion} />}
        {posicion && <Marker position={posicion} />}
      </MapContainer>
    </div>
  )
}

export default MapaPicker
