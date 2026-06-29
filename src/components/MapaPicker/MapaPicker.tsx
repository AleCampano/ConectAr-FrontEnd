import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapaPicker.css'

const pinIcon = new L.DivIcon({
  className: '',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 26 16 26S32 26.5 32 16C32 7.163 24.837 0 16 0z"
        fill="#00bcd4" stroke="#0097a7" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
})

function Centrar({ posicion }: { posicion: [number, number] }) {
  const mapa = useMap()
  useEffect(() => {
    mapa.setView(posicion, 15)
  }, [posicion[0], posicion[1]])
  return null
}

type Props = {
  posicion: [number, number] | null
}

function MapaPicker({ posicion }: Props) {
  const centro: [number, number] = posicion ?? [-34.6037, -58.3816]

  return (
    <div className="mapa-picker">
      <MapContainer center={centro} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {posicion && <Centrar posicion={posicion} />}
        {posicion && <Marker position={posicion} icon={pinIcon} />}
      </MapContainer>
    </div>
  )
}

export default MapaPicker
