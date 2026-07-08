import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '@/lib/types';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export function LocationMap({
  locations,
  center = [48.8566, 2.3522] as [number, number],
  zoom = 11,
}: {
  locations: Location[];
  center?: [number, number];
  zoom?: number;
}) {
  return (
    <div className="h-56 overflow-hidden rounded-xl border border-slate-200 sm:h-64 md:h-80">
      <MapContainer center={center} zoom={zoom} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
            <Popup>
              <strong>{loc.title}</strong>
              <br />
              {loc.city}
              {loc.distanceKm != null && (
                <>
                  <br />
                  {loc.distanceKm.toFixed(1)} km
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
