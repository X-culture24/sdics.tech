import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(defaultIcon);

export interface CountyData {
  name: string;
  lat: number;
  lng: number;
  registered: number;
  unregistered: number;
  percentage: number;
}

interface KenyaMapProps {
  countyData?: CountyData[];
  onCountyClick?: (county: CountyData) => void;
}

const KENYA_CENTER: LatLngExpression = [-0.023559, 37.906193];

// Major Kenyan counties with coordinates
const COUNTIES = [
  { name: 'Baringo', lat: 0.473, lng: 36.1 },
  { name: 'Bomet', lat: -0.827, lng: 35.397 },
  { name: 'Elgeyo-Marakwet', lat: 1.175, lng: 35.467 },
  { name: 'Kajiado', lat: -1.95, lng: 36.78 },
  { name: 'Kericho', lat: -0.361, lng: 35.282 },
  { name: 'Nandi', lat: 0.39, lng: 34.953 },
  { name: 'Narok', lat: -1.032, lng: 35.867 },
  { name: 'Samburu', lat: 1.5, lng: 37.5 },
  { name: 'Uasin Gishu', lat: 0.93, lng: 34.783 },
  { name: 'West Pokot', lat: 1.405, lng: 35.238 },
];

export const KenyaMap: React.FC<KenyaMapProps> = ({ countyData, onCountyClick }) => {
  const getCountyData = (countyName: string) => {
    return countyData?.find((d) => d.name.toLowerCase() === countyName.toLowerCase());
  };

  const getMarkerColor = (percentage: number) => {
    if (percentage >= 80) return '#2D8659'; // Green
    if (percentage >= 60) return '#FFA500'; // Orange
    if (percentage >= 40) return '#FF6B4A'; // Orange-red
    return '#C41E3A'; // Red
  };

  return (
    <MapContainer center={KENYA_CENTER} zoom={7} style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {COUNTIES.map((county) => {
        const data = getCountyData(county.name);
        const markerColor = data ? getMarkerColor(data.percentage) : '#999999';

        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${markerColor};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              font-size: 12px;
            ">
              ${data ? Math.round(data.percentage) : '?'}%
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        return (
          <Marker
            key={county.name}
            position={[county.lat, county.lng] as any}
            icon={customIcon}
            eventHandlers={{
              click: () => {
                if (data && onCountyClick) {
                  onCountyClick(data);
                }
              },
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong>{county.name}</strong>
                {data ? (
                  <>
                    <div>Registered: {data.registered.toLocaleString()}</div>
                    <div>Unregistered: {data.unregistered.toLocaleString()}</div>
                    <div style={{ color: markerColor, fontWeight: 'bold' }}>
                      Completion: {data.percentage.toFixed(1)}%
                    </div>
                  </>
                ) : (
                  <div>No data available</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};
