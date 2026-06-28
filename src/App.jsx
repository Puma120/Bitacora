import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Sparkles, Plus, Map as MapIcon, List as ListIcon } from 'lucide-react';
import Home from './views/Home';
import PlaceTimeline from './views/PlaceTimeline';
import PlacesMap from './views/PlacesMap';
import { useState } from 'react';
import CaptureMemoryModal from './components/CaptureMemoryModal';
import Login from './views/Login';
import InstallAppButton from './components/InstallAppButton';

function AppContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlaceId, setCurrentPlaceId] = useState(null);
  const location = useLocation();

  const handleOpenModal = (placeId = null) => {
    setCurrentPlaceId(placeId);
    setIsModalOpen(true);
  };

  const isTimeline = location.pathname.includes('/place/');
  const currentPathId = isTimeline ? location.pathname.split('/place/')[1] : null;
  
  const isListActive = location.pathname === '/' || location.pathname.startsWith('/place/');
  const isMapActive = location.pathname === '/map';

  return (
    <div className="min-h-screen pb-24">
      {/* Header Frutiger Aero */}
      <header className="sticky top-0 z-40 glass border-b border-white/50 px-4 py-4 mb-4 shadow-[0_4px_20px_rgba(0,168,232,0.15)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] text-white p-2 rounded-full aero-glow">
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-blue-600 drop-shadow-sm">
              Bitácora de Visitas
            </h1>
          </Link>
          <InstallAppButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 relative z-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<PlacesMap />} />
          <Route path="/place/:id" element={<PlaceTimeline onAddMemory={() => handleOpenModal()} />} />
        </Routes>
      </main>

      {/* FAB - Always visible */}
      <div className="fixed inset-x-0 bottom-32 z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-2xl px-4 flex justify-end">
          <button
            onClick={() => handleOpenModal(currentPathId)}
            className="pointer-events-auto btn-glossy text-white p-4 rounded-full aero-glow transition-transform active:scale-95 hover:scale-105 shadow-lg"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-6 z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-2xl px-4 pointer-events-auto">
          <div className="glass-card flex items-center justify-around p-2 rounded-3xl border border-white/60 shadow-[0_10px_30px_rgba(0,168,232,0.3)] bg-white/70 dark:bg-[#0b2f3d]/70">
            <Link 
              to="/" 
              className={`flex-1 flex flex-col items-center py-2 px-4 rounded-2xl transition-all ${isListActive ? 'bg-white/50 dark:bg-black/20 text-[var(--primary)] shadow-inner' : 'text-gray-500 hover:bg-white/30'}`}
            >
              <ListIcon size={20} className="mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Lista</span>
            </Link>
            
            <Link 
              to="/map" 
              className={`flex-1 flex flex-col items-center py-2 px-4 rounded-2xl transition-all ${isMapActive ? 'bg-white/50 dark:bg-black/20 text-[var(--primary)] shadow-inner' : 'text-gray-500 hover:bg-white/30'}`}
            >
              <MapIcon size={20} className="mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Mapa</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CaptureMemoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        defaultPlaceId={currentPlaceId}
      />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('bitacora_auth') === 'true'
  );

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <AppContent />
    </Router>
  );
}
