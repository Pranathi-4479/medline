
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { Donation } from '../types';
import { 
  MapPin, Truck, CheckCircle, Clock, Navigation, 
  Package, Home, Building2, Maximize2, Columns, 
  Smartphone, ChevronDown, ChevronUp, User 
} from 'lucide-react';

// Declaration for Leaflet attached to window
declare const L: any;

type LayoutMode = 'split' | 'vertical' | 'full';

const Tracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { donations } = useGlobal();
  const { user } = useAuth();
  const [donation, setDonation] = useState<Donation | undefined>();
  
  // Layout State
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false);

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const animationRef = useRef<number>(0);
  const isMapInitialized = useRef(false);

  // Define Fixed Locations
  const AGENT_BASE = [40.7306, -73.9352]; // Agent Hub (Queens)
  const DONOR_LOC = [40.7128, -74.0060];  // Donor (Downtown)
  const NGO_LOC = [40.7589, -73.9851];    // NGO (Midtown)

  // 1. Set Default Layout based on Role
  useEffect(() => {
    if (user) {
      if (user.role === 'delivery') {
        setLayoutMode('vertical'); // Delivery agents prefer GPS style
      } else {
        setLayoutMode('split'); // Admin/Donor/NGO prefer Dashboard style
      }
    }
  }, [user]);

  // 2. Update local state when global data changes
  useEffect(() => {
    const found = donations.find(d => d.id === id);
    if (found) {
        setDonation(found);
    }
  }, [id, donations]);

  // Determine current route points based on status
  // Phase 1 (Assigned): Agent -> Donor
  // Phase 2 (Picked Up): Donor -> NGO
  const isPhase1 = donation?.status === 'assigned';
  const startPoint = isPhase1 ? AGENT_BASE : DONOR_LOC;
  const endPoint = isPhase1 ? DONOR_LOC : NGO_LOC;

  // 3. Initialize Map (Run Once)
  useEffect(() => {
    if (!mapRef.current || isMapInitialized.current) return;

    // Create Map
    const map = L.map(mapRef.current, { zoomControl: false }).setView(DONOR_LOC, 12);
    mapInstanceRef.current = map;
    isMapInitialized.current = true;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        isMapInitialized.current = false;
      }
    };
  }, []);

  // 4. Update Map Elements (Markers, Route, Animation) when Status changes
  useEffect(() => {
    if (!mapInstanceRef.current || !donation) return;

    // Clear previous elements
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Custom Icon Helpers
    const createCustomIcon = (iconHtml: string, colorClass: string) => {
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="${colorClass} w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">${iconHtml}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
    };

    const donorIcon = createCustomIcon('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', 'bg-gray-600');
    const ngoIcon = createCustomIcon('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>', 'bg-blue-600');
    const agentIcon = createCustomIcon('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>', 'bg-orange-500');

    // Add Static Markers based on Phase
    if (isPhase1) {
       L.marker(AGENT_BASE, { icon: agentIcon }).addTo(mapInstanceRef.current).bindPopup('<b>Delivery Base</b><br>Agent Starting Point');
       L.marker(DONOR_LOC, { icon: donorIcon }).addTo(mapInstanceRef.current).bindPopup('<b>Your Location</b><br>Pickup Point');
    } else {
       L.marker(DONOR_LOC, { icon: donorIcon }).addTo(mapInstanceRef.current).bindPopup('<b>Pickup Point</b><br>Medicine Collected');
       L.marker(NGO_LOC, { icon: ngoIcon }).addTo(mapInstanceRef.current).bindPopup('<b>Destination</b><br>NGO Warehouse');
    }

    // Draw Route Line
    const latlngs = [startPoint, endPoint];
    routeLineRef.current = L.polyline(latlngs, { color: isPhase1 ? '#f97316' : '#0d9488', weight: 4, opacity: 0.7, dashArray: '10, 10' }).addTo(mapInstanceRef.current);
    mapInstanceRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });

    // Truck Animation
    const truckIcon = L.divIcon({
      className: 'truck-icon',
      html: `<div class="${isPhase1 ? 'bg-orange-500' : 'bg-teal-600'} w-10 h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white relative">
              <div class="absolute -inset-1 ${isPhase1 ? 'bg-orange-400' : 'bg-teal-400'} rounded-full opacity-30 animate-ping"></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
             </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (truckMarkerRef.current) truckMarkerRef.current.remove();

    // If active status, animate
    if (donation.status === 'assigned' || donation.status === 'picked_up') {
      truckMarkerRef.current = L.marker(startPoint, { icon: truckIcon }).addTo(mapInstanceRef.current);
      
      let start = performance.now();
      const duration = 15000; // Simulated travel time for demo

      const animate = (time: number) => {
        if (!mapInstanceRef.current) return;
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) {
          start = time; // Loop animation
          timeFraction = 0;
        }
        
        // Linear Interpolation
        const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * timeFraction;
        const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * timeFraction;
        
        if (truckMarkerRef.current) {
          truckMarkerRef.current.setLatLng([lat, lng]);
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(animate);
    } else if (donation.status === 'delivered' || donation.status === 'verified') {
       // Static at end
       truckMarkerRef.current = L.marker(NGO_LOC, { icon: truckIcon }).addTo(mapInstanceRef.current);
    }

    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [donation?.status, isPhase1]);

  // 5. Handle Resize Events to fix Leaflet rendering issues
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current.invalidateSize(), 300);
      }
    };

    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layoutMode, isDetailsCollapsed]);


  if (!donation) return <div className="p-10 text-center flex flex-col items-center"><div className="animate-spin h-8 w-8 border-2 border-teal-600 rounded-full border-t-transparent mb-4"></div>Loading map data...</div>;

  const isDelivered = ['delivered', 'verified', 'rejected'].includes(donation.status);
  
  // Helper to get container classes based on layout mode
  const getContainerClasses = () => {
    switch(layoutMode) {
      case 'vertical': return 'flex-col';
      case 'full': return 'relative';
      default: return 'flex-col lg:flex-row'; // split
    }
  };

  const getMapClasses = () => {
    switch(layoutMode) {
      case 'vertical': return 'h-[60vh] w-full';
      case 'full': return 'absolute inset-0 z-0 h-full w-full';
      default: return 'h-[50vh] lg:h-full lg:flex-1';
    }
  };

  return (
    <div className={`flex h-[calc(100vh-64px)] bg-gray-100 overflow-hidden ${getContainerClasses()}`}>
      
      {/* MAP SECTION */}
      <div className={`relative transition-all duration-300 ${getMapClasses()}`}>
        <div ref={mapRef} className="w-full h-full z-0 bg-gray-200"></div>
        
        {/* Layout Controls Overlay */}
        <div className="absolute top-4 right-4 z-[400] bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex flex-col space-y-1">
          <button onClick={() => setLayoutMode('split')} className={`p-2 rounded hover:bg-gray-100 ${layoutMode === 'split' ? 'bg-teal-50 text-teal-600' : 'text-gray-500'}`} title="Split View"><Columns size={20} /></button>
          <button onClick={() => setLayoutMode('vertical')} className={`p-2 rounded hover:bg-gray-100 ${layoutMode === 'vertical' ? 'bg-teal-50 text-teal-600' : 'text-gray-500'}`} title="Vertical View"><Smartphone size={20} /></button>
          <button onClick={() => setLayoutMode('full')} className={`p-2 rounded hover:bg-gray-100 ${layoutMode === 'full' ? 'bg-teal-50 text-teal-600' : 'text-gray-500'}`} title="Full Map"><Maximize2 size={20} /></button>
        </div>

        {/* Back Button Overlay */}
        <div className="absolute top-4 left-4 z-[400]">
           <button onClick={() => navigate(-1)} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center font-medium transition">
             <Navigation className="h-4 w-4 rotate-180 mr-2" /> Back
           </button>
        </div>
      </div>

      {/* DETAILS SECTION */}
      <div className={`bg-white shadow-xl z-10 transition-all duration-300 overflow-y-auto
          ${layoutMode === 'vertical' ? 'h-[40vh] w-full rounded-t-2xl border-t border-gray-200' : ''}
          ${layoutMode === 'split' ? 'h-full w-full lg:w-[400px] border-l border-gray-200' : ''}
          ${layoutMode === 'full' ? `absolute bottom-6 left-6 right-6 rounded-2xl max-h-[40vh] ${isDetailsCollapsed ? 'h-16' : 'h-auto'}` : ''}
        `}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur z-20 p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer"
             onClick={() => layoutMode === 'full' && setIsDetailsCollapsed(!isDetailsCollapsed)}
        >
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-gray-800">#{donation.pickup_code}</h2>
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold uppercase ${isDelivered ? 'bg-green-100 text-green-700' : isPhase1 ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                {donation.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500">{donation.medicine_name}</p>
          </div>
          {layoutMode === 'full' && <button className="text-gray-400">{isDetailsCollapsed ? <ChevronUp /> : <ChevronDown />}</button>}
        </div>

        <div className={`p-6 ${layoutMode === 'full' && isDetailsCollapsed ? 'hidden' : 'block'}`}>
          {isPhase1 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 flex items-start">
              <Clock className="text-orange-600 mt-1 mr-3 flex-shrink-0" size={20} />
              <div>
                <p className="font-bold text-orange-800 text-sm">Agent Arriving</p>
                <p className="text-xs text-orange-600">The delivery agent is on their way to your location for pickup.</p>
              </div>
            </div>
          ) : !isDelivered ? (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-6 flex items-start">
              <Navigation className="text-teal-600 mt-1 mr-3 flex-shrink-0" size={20} />
              <div>
                <p className="font-bold text-teal-800 text-sm">Shipment in Progress</p>
                <p className="text-xs text-teal-600">Medicine collected and en route to the NGO warehouse.</p>
              </div>
            </div>
          ) : null}

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Logistics Timeline</h3>
          
          <div className="relative pl-6 border-l-2 border-gray-100 space-y-8">
            <div className="relative">
              <div className="absolute -left-[33px] bg-white border-2 border-gray-100 p-1 rounded-full"><CheckCircle size={14} className="text-green-500" /></div>
              <div className="text-sm"><p className="font-bold text-gray-900">Order Confirmed</p><p className="text-xs text-gray-500">{new Date(donation.created_at).toLocaleTimeString()}</p></div>
            </div>

            <div className="relative">
               <div className={`absolute -left-[33px] bg-white border-2 border-gray-100 p-1 rounded-full`}>
                 <User size={14} className={donation.status !== 'pending' ? "text-green-500" : "text-gray-400"} />
               </div>
               <div className="text-sm">
                <p className={`font-bold ${donation.status !== 'pending' ? 'text-gray-900' : 'text-gray-400'}`}>Agent Assigned</p>
                {isPhase1 && <p className="text-xs text-orange-500 font-bold animate-pulse">Agent is 10 mins away</p>}
               </div>
            </div>

            <div className="relative">
               <div className={`absolute -left-[33px] bg-white border-2 border-gray-100 p-1 rounded-full`}>
                 <Package size={14} className={!isPhase1 && donation.status !== 'pending' ? "text-green-500" : "text-gray-400"} />
               </div>
               <div className="text-sm">
                <p className={`font-bold ${!isPhase1 && donation.status !== 'pending' ? 'text-gray-900' : 'text-gray-400'}`}>Pickup Verified</p>
               </div>
            </div>

            <div className="relative">
               <div className={`absolute -left-[33px] bg-white border-2 border-gray-100 p-1 rounded-full`}>
                 <MapPin size={14} className={isDelivered ? "text-green-500" : "text-gray-400"} />
               </div>
               <div className="text-sm">
                 <p className={`font-bold ${isDelivered ? 'text-gray-900' : 'text-gray-400'}`}>Delivered to Hub</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
