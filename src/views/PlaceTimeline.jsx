import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Tag as TagIcon, Loader2, Trash2 } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ConfirmModal from '../components/ConfirmModal';

export default function PlaceTimeline() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingMemoryId, setDeletingMemoryId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'places', id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setPlace({ id: docSnapshot.id, ...docSnapshot.data() });
      } else {
        setPlace(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const handleDeleteMemory = async () => {
    if (!deletingMemoryId || !place) return;
    try {
      const updatedMemories = place.memories.map(m => 
        m.id === deletingMemoryId ? { ...m, isDeleted: true } : m
      );
      await updateDoc(doc(db, 'places', place.id), {
        memories: updatedMemories
      });
    } catch (error) {
      console.error("Error al borrar memoria", error);
    }
    setDeletingMemoryId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!place) return <div className="text-center py-20 font-bold text-gray-500">Lugar no encontrado</div>;

  // sort memories descending and filter deleted
  const placeMemories = place.memories 
    ? [...place.memories].filter(m => !m.isDeleted).sort((a, b) => new Date(b.date) - new Date(a.date)) 
    : [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      {/* Header (Back button and Place info) */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--primary)] font-medium transition-colors mb-4">
          <ArrowLeft size={20} />
          <span>Volver al inicio</span>
        </Link>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{place.name}</h2>
        
        {place.mapsUrl && (
          <a 
            href={place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold text-[#00a8e8] hover:text-[#007ba8] transition-colors"
          >
            <MapPin size={16} />
            Ubicación en Google Maps
          </a>
        )}
      </div>

      {/* Timeline */}
      <div className="relative border-l-2 border-[#00a8e8]/30 dark:border-[#00d2ff]/30 ml-4 pl-6 flex flex-col gap-8 pb-10">
        
        {placeMemories.map((memory) => {
          const mainColor = memory.colors[0] || '#00a8e8';
          
          return (
            <div key={memory.id} className="relative group">
              {/* Timeline Dot */}
              <div 
                className="absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 border-white dark:border-[#061e26] shadow-sm transition-transform group-hover:scale-150"
                style={{ backgroundColor: mainColor }}
              />
              
              <div 
                className="glass-card rounded-3xl overflow-hidden aero-glow transition-all hover:shadow-[0_8px_30px_rgba(0,168,232,0.15)] relative"
                style={{
                  borderColor: `${mainColor}60`
                }}
              >
                {/* Color Tint Overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-15 dark:opacity-30 mix-blend-color z-0"
                  style={{ backgroundColor: mainColor }}
                />
                
                {/* Photo */}
                <div className="w-full aspect-square sm:aspect-[4/3] bg-gray-100 dark:bg-gray-800 relative overflow-hidden z-10">
                  <img 
                    src={memory.imageUrl} 
                    alt="Recuerdo" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Date badge on top of image */}
                  <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-xl text-sm font-bold text-gray-800 dark:text-white shadow-sm">
                    {new Date(memory.date).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-4 relative z-10">
                  {/* Notes */}
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {memory.notes}
                  </p>

                  {/* Tags and Delete Button */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-wrap gap-2">
                      {memory.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs font-bold bg-white/50 dark:bg-black/20 text-[#0b3b4d] dark:text-gray-200 px-3 py-1.5 rounded-xl border border-white/60 dark:border-gray-700/50 shadow-sm backdrop-blur-md">
                          <TagIcon size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setDeletingMemoryId(memory.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {placeMemories.length === 0 && (
          <div className="text-gray-500 py-10">No hay recuerdos aquí.</div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deletingMemoryId}
        onClose={() => setDeletingMemoryId(null)}
        onConfirm={handleDeleteMemory}
        title="Ocultar recuerdo"
        message="¿Estás seguro de que quieres ocultar este recuerdo de la bitácora?"
      />
    </div>
  );
}
