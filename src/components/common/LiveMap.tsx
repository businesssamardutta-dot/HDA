import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Order } from '../../types';

// Fix leaflet marker icon issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface LiveMapProps {
  order: Order;
}

export const LiveMap: React.FC<LiveMapProps> = ({ order }) => {
  // Mock coordinates for center (e.g. Bangalore)
  const center: [number, number] = [12.9716, 77.5946];
  const [currentPos, setCurrentPos] = useState<[number, number]>([12.9600, 77.5900]);
  const [route, setRoute] = useState<[number, number][]>([
    [12.9600, 77.5900],
    [12.9650, 77.5920],
    [12.9716, 77.5946]
  ]);

  // Simulate WebSocket Live Updates
  useEffect(() => {
    let wsSim = setInterval(() => {
      setCurrentPos(prev => {
        // Move towards center slowly
        const lat = prev[0] + (center[0] - prev[0]) * 0.1;
        const lng = prev[1] + (center[1] - prev[1]) * 0.1;
        const newPos: [number, number] = [lat, lng];
        
        setRoute(prevRoute => {
            const next = [...prevRoute, newPos];
            return next.length > 50 ? next.slice(next.length - 50) : next;
        });

        return newPos;
      });
    }, 2000);
    return () => clearInterval(wsSim);
  }, []);

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Destination Marker */}
      <Marker position={center}>
        <Popup>
          <strong>Destination</strong><br />
          {order.customer_name}<br />
          {order.delivery_address_text}
        </Popup>
      </Marker>

      {/* Courier Marker */}
      <Marker position={currentPos} icon={deliveryIcon}>
        <Popup>
          <strong>Courier: {order.assigned_delivery_boy_name || 'Assigned Rider'}</strong><br />
          Speed: 45 km/h<br />
          Status: En Route
        </Popup>
      </Marker>

      <Polyline positions={route} color="#10b981" weight={4} dashArray="10, 10" />
    </MapContainer>
  );
};
