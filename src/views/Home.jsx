import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Image as ImageIcon, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'places'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const placesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlaces(placesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold">Nuestros lugares favoritos</h2>
        <span className="text-sm text-gray-500 font-medium">{places.length} lugares</span>
      </div>
      
      {places.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Aún no han guardado lugares. ¡Abre el botón + para empezar!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {places.map((place) => (
            <Link 
              key={place.id} 
              to={`/place/${place.id}`}
              className="group relative block glass-card rounded-2xl p-4 overflow-hidden aero-glow transition-all w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 pr-4">
                    <h3 className="text-xl font-bold text-[#0b3b4d] dark:text-white group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                      {place.name}
                    </h3>
                    {place.mapsUrl && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(place.mapsUrl, '_blank');
                        }}
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--primary)] transition-colors mt-1"
                      >
                        <MapPin size={14} />
                        Ver en mapa
                      </button>
                    )}
                </div>
                
                <div className="flex flex-col items-center justify-center glass rounded-xl p-2 min-w-[3rem]">
                  <ImageIcon size={16} className="text-[var(--primary)] mb-1" />
                  <span className="text-sm font-bold text-[#0b3b4d] dark:text-white">{place.memories?.length || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
