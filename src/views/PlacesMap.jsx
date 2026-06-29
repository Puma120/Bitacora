import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';

// Fixes Leaflet tile loading issues in animated/dynamic containers
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 400); // Wait for animations to finish
      return () => clearTimeout(timeout);
    }
  }, [center, map]);
  return null;
}

export default function PlacesMap() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Default to Plaza San Diego, Puebla
  const defaultCenter = [19.0638, -98.2831];

  useEffect(() => {
    // Get user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    const q = query(collection(db, 'places'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const placesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(p => p.lat && p.lng && !p.isDeleted); // Keep active places with coordinates
      
      setPlaces(placesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createCustomIcon = (place) => {
    // Get the first memory's first color, or fallback to a primary-ish color
    const color = place.memories?.[0]?.colors?.[0] || '#00a8e8';
    
    return divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color}90;
          border: 2px solid white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px ${color}50;
          backdrop-filter: blur(4px);
        ">
          <div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  const userLocationIcon = divIcon({
    className: 'user-marker',
    html: `
      <div style="
        background-color: #22c55e90;
        border: 2px solid white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(34, 197, 94, 0.5);
        backdrop-filter: blur(4px);
      ">
        <div style="background-color: #22c55e; width: 12px; height: 12px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  if (loading) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#061e26] absolute inset-0 z-0">
        <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  // Center on user location if available, else fallback to default or first place
  const center = userLocation || defaultCenter;

  return (
    <div className="w-full h-[calc(100vh-140px)] rounded-3xl overflow-hidden glass-card aero-glow border border-white/50 dark:border-[#134e63] relative z-0 animate-in fade-in zoom-in-95 duration-500">
      <MapContainer 
        center={center} 
        zoom={14} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <MapUpdater center={center} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup className="glass-popup">
              <div className="font-bold text-center">¡Estás aquí! 📍</div>
            </Popup>
          </Marker>
        )}

        {places.map((place) => (
          <Marker 
            key={place.id} 
            position={[place.lat, place.lng]}
            icon={createCustomIcon(place)}
          >
            <Popup className="glass-popup">
              <div className="flex flex-col gap-2 min-w-[200px] p-1">
                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                  {place.name}
                </h3>
                <span className="text-sm text-gray-500 font-medium">
                  {place.memories?.filter(m => !m.isDeleted).length || 0} recuerdos aquí
                </span>
                
                <div className="flex gap-2 mt-2">
                  <Link 
                    to={`/place/${place.id}`}
                    className="flex-1 btn-glossy text-center py-2 rounded-xl text-sm font-bold aero-glow"
                  >
                    Ver Timeline
                  </Link>
                  {place.mapsUrl && (
                    <a 
                      href={place.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    >
                      <MapPin size={16} />
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
