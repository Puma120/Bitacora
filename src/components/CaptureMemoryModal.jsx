import { useState, useEffect } from 'react';
import { X, Upload, MapPin, Tag as TagIcon, Sparkles, Plus, Loader2 } from 'lucide-react';
import { getPalette } from 'colorthief';
import { collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_COLORS = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'];
const DEFAULT_PLACE_TAGS = ['Barato', 'Rico', 'Postres', 'Comida', 'Desayunos', 'Bebidas', 'Cita ideal'];

// Componente para capturar el clic en el mapa
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  
  const customIcon = divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #00a8e8; border: 2px solid white; width: 24px; height: 24px; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,168,232,0.4);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]} icon={customIcon} />
  );
}

function ModalMapUpdater() {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timeout);
  }, [map]);
  return null;
}

export default function CaptureMemoryModal({ isOpen, onClose, defaultPlaceId }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState(DEFAULT_PLACE_TAGS);
  const [newTagInput, setNewTagInput] = useState('');
  
  // Date picker (defaults to today in YYYY-MM-DD format)
  const [memoryDate, setMemoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedColors, setExtractedColors] = useState(DEFAULT_COLORS);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Form fields
  const [placeTitle, setPlaceTitle] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [diaryText, setDiaryText] = useState('');
  
  // Existing place data
  const [existingPlaceName, setExistingPlaceName] = useState('');
  
  // Map Location
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (isOpen && defaultPlaceId) {
      const fetchPlace = async () => {
        try {
          const docRef = doc(db, 'places', defaultPlaceId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setExistingPlaceName(docSnap.data().name);
          }
        } catch (e) {
          console.error("Error fetching place", e);
        }
      };
      fetchPlace();
    } else {
      setExistingPlaceName('');
      setPlaceTitle('');
      setSelectedLocation(null);
      setMapsUrl('');
      setMemoryDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, defaultPlaceId]);
  
  if (!isOpen) return null;

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !availableTags.includes(trimmed)) {
      setAvailableTags([...availableTags, trimmed]);
      setSelectedTags([...selectedTags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setIsExtracting(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        
        const img = new Image();
        img.src = e.target.result;
        img.onload = async () => {
          try {
            const palette = await getPalette(img, { colorCount: 4 });
            if (palette) {
              const hexColors = palette.map(c => c.hex());
              setExtractedColors(hexColors);
            }
          } catch (error) {
            console.error("No se pudieron extraer los colores", error);
          } finally {
            setIsExtracting(false);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      console.warn("Faltan credenciales de Cloudinary, usando imagen local (temporal)");
      return imagePreview; 
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Detalles del error de Cloudinary:', errorText);
      throw new Error(`Error Cloudinary: ${errorText}`);
    }
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!defaultPlaceId && !placeTitle) || !diaryText || !imageFile) {
      alert("Por favor llena la información requerida.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload Image
      const imageUrl = await uploadToCloudinary(imageFile);

      // 2. Prepare Memory Object
      // Use the selected date (force time to noon to avoid timezone date shifting issues)
      const dateIso = new Date(`${memoryDate}T12:00:00Z`).toISOString();
      
      const newMemory = {
        id: Date.now().toString(),
        imageUrl: imageUrl,
        colors: extractedColors,
        tags: selectedTags,
        notes: diaryText,
        date: dateIso
      };

      if (defaultPlaceId) {
        // Update existing directly by ID
        const placeRef = doc(db, 'places', defaultPlaceId);
        await updateDoc(placeRef, {
          memories: arrayUnion(newMemory)
        });
      } else {
        // 3. Check if Place Exists by Name
        const placesRef = collection(db, 'places');
        const q = query(placesRef, where('name', '==', placeTitle.trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Update existing place
          const existingDoc = querySnapshot.docs[0];
          await updateDoc(existingDoc.ref, {
            memories: arrayUnion(newMemory),
            ...(mapsUrl && { mapsUrl }) // Actualizar URL si agregaron una nueva
          });
        } else {
          // Create new place
          await addDoc(placesRef, {
            name: placeTitle.trim(),
            mapsUrl: mapsUrl,
            lat: selectedLocation?.lat || null,
            lng: selectedLocation?.lng || null,
            createdAt: serverTimestamp(),
            memories: [newMemory]
          });
        }
      }

      // 4. Reset & Close
      onClose();
      setImagePreview(null);
      setImageFile(null);
      setSelectedTags([]);
      setExtractedColors(DEFAULT_COLORS);
      if (!defaultPlaceId) {
        setPlaceTitle('');
        setMapsUrl('');
        setSelectedLocation(null);
      }
      setDiaryText('');
      setMemoryDate(new Date().toISOString().split('T')[0]);

    } catch (error) {
      console.error("Error guardando el recuerdo:", error);
      alert("Hubo un error al guardar. Revisa la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl aero-glow relative flex flex-col bg-white dark:bg-[#061e26] border border-[#bce6f4] dark:border-[#134e63]">
        
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-[#bce6f4] dark:border-[#134e63] bg-white/90 dark:bg-[#061e26]/90 backdrop-blur-md rounded-t-3xl">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#0b3b4d] dark:text-[#e0f7fa]">
            <Sparkles size={20} className="text-[var(--primary)]" />
            {defaultPlaceId ? 'Nuevo Recuerdo Aquí' : 'Nuevo Lugar'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-[#0b2f3d] dark:hover:bg-[#134e63] text-gray-700 dark:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6">
          
          {defaultPlaceId && existingPlaceName && (
            <div className="bg-[var(--primary)]/10 p-3 rounded-xl border border-[var(--primary)]/20 text-[#0b3b4d] dark:text-[#e0f7fa] font-medium text-sm text-center shadow-inner">
              Añadiendo recuerdo a: <strong className="block text-lg mt-1">{existingPlaceName}</strong>
            </div>
          )}

          {/* Título del lugar (solo si es nuevo) */}
          {!defaultPlaceId && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#0b3b4d] dark:text-[#e0f7fa]">Título del lugar</label>
              <input 
                type="text" 
                value={placeTitle}
                onChange={e => setPlaceTitle(e.target.value)}
                placeholder="Ej. Cafetería El Jarocho" 
                className="w-full bg-gray-50 dark:bg-[#0b2f3d] border border-gray-200 dark:border-[#134e63] rounded-xl p-3 text-sm text-[#0b3b4d] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                required={!defaultPlaceId}
              />
            </div>
          )}

          {/* Image Upload Zone */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#0b3b4d] dark:text-[#e0f7fa]">Foto del Recuerdo</label>
            <div className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-[#0b2f3d] rounded-2xl border-2 border-dashed border-[#bce6f4] dark:border-[#134e63] flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:border-[var(--primary)] transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={handleImageChange}
                required
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload size={32} className="text-gray-400 group-hover:text-[var(--primary)] transition-colors mb-2" />
                  <span className="text-sm font-medium text-gray-500 group-hover:text-[var(--primary)] transition-colors">Sube tu foto favorita</span>
                </>
              )}
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#0b3b4d] dark:text-[#e0f7fa]">Fecha de la visita</label>
            <input 
              type="date" 
              value={memoryDate}
              onChange={e => setMemoryDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0b2f3d] border border-gray-200 dark:border-[#134e63] rounded-xl p-3 text-sm text-[#0b3b4d] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all cursor-text"
              required
            />
          </div>

          {/* Color Extraction */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#0b3b4d] dark:text-[#e0f7fa] flex items-center gap-2">
              Colores de la cita 
              {isExtracting && <Loader2 size={14} className="animate-spin text-[var(--primary)]" />}
            </label>
            <div className="flex h-8 w-full rounded-xl overflow-hidden shadow-inner transition-opacity duration-300" style={{ opacity: isExtracting ? 0.5 : 1 }}>
              {extractedColors.map((color, idx) => (
                <div key={idx} className="flex-1 transition-colors duration-500" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          {/* Place Tags */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#0b3b4d] dark:text-[#e0f7fa]">¿Qué tal estuvo?</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-xl transition-all ${
                    selectedTags.includes(tag) 
                      ? 'btn-glossy border-transparent aero-glow' 
                      : 'bg-gray-100 dark:bg-[#0b2f3d] text-gray-600 dark:text-[#e0f7fa] hover:border-[var(--primary)] border border-transparent'
                  }`}
                >
                  <TagIcon size={12} />
                  {tag}
                </button>
              ))}
            </div>
            
            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="text" 
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                placeholder="Añadir otro tag..." 
                className="flex-1 bg-gray-50 dark:bg-[#0b2f3d] border border-gray-200 dark:border-[#134e63] rounded-xl py-2 px-3 text-sm text-[#0b3b4d] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
              />
              <button 
                type="button"
                onClick={handleAddCustomTag}
                className="p-2 rounded-xl bg-gray-100 dark:bg-[#0b2f3d] text-[var(--primary)] hover:bg-blue-50 dark:hover:bg-[#134e63] transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Ubicación (Mini Mapa interactivo) - Solo si es nuevo */}
          {!defaultPlaceId && (
            <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-[#0b2f3d] rounded-2xl border border-gray-100 dark:border-[#134e63]">
              <label className="text-sm font-bold text-[#0b3b4d] dark:text-[#e0f7fa] flex items-center gap-1">
                <MapPin size={16} className="text-[var(--primary)]" /> Toca el mapa para ubicar el lugar
              </label>
              
              <div className="h-48 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-[#134e63] shadow-inner relative z-0">
                <MapContainer 
                  center={[19.0638, -98.2831]} // Plaza San Diego, Puebla
                  zoom={14} 
                  className="w-full h-full"
                  zoomControl={false}
                >
                  <ModalMapUpdater />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  <LocationPicker position={selectedLocation} setPosition={setSelectedLocation} />
                </MapContainer>
              </div>
              
              {selectedLocation && (
                <span className="text-xs font-bold text-[var(--primary)] text-center bg-blue-50 dark:bg-[#134e63] py-1 rounded-lg">
                  📍 Coordenadas guardadas
                </span>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <div className="h-px bg-gray-200 dark:bg-[#134e63] flex-1"></div>
                <span className="text-xs text-gray-400 font-bold uppercase">Y/O pega el link</span>
                <div className="h-px bg-gray-200 dark:bg-[#134e63] flex-1"></div>
              </div>

              <input 
                type="url" 
                value={mapsUrl}
                onChange={e => setMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..." 
                className="w-full bg-white dark:bg-[#061e26] border border-gray-200 dark:border-[#134e63] rounded-xl p-3 text-sm text-[#0b3b4d] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all shadow-sm"
              />
            </div>
          )}

          {/* Note */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#0b3b4d] dark:text-[#e0f7fa]">Diario</label>
            <textarea 
              rows="4" 
              value={diaryText}
              onChange={e => setDiaryText(e.target.value)}
              placeholder="¿Qué hizo especial este lugar?..." 
              className="w-full bg-gray-50 dark:bg-[#0b2f3d] border border-gray-200 dark:border-[#134e63] rounded-xl p-3 text-sm text-[#0b3b4d] dark:text-white placeholder:text-gray-400 resize-none focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
              required
            ></textarea>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 btn-glossy font-bold text-lg py-4 rounded-2xl aero-glow mt-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting ? <><Loader2 size={24} className="animate-spin" /> Guardando...</> : 'Guardar Recuerdo 💾'}
          </button>

        </form>
      </div>
    </div>
  );
}
