import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { 
  Users, Activity, Bell, Settings, Search, UserPlus, 
  Tractor, MessageCircle, AlertTriangle, CheckCircle2, ChevronDown
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Fix for leaflet default icons in React
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Mock Data
const activeUsersData = [
  { time: '00:00', users: 30 },
  { time: '02:00', users: 20 },
  { time: '04:00', users: 15 },
  { time: '06:00', users: 40 },
  { time: '08:00', users: 90 },
  { time: '10:00', users: 130 },
  { time: '12:00', users: 145 },
  { time: '14:00', users: 137 },
  { time: '16:00', users: 120 },
  { time: '18:00', users: 110 },
  { time: '20:00', users: 80 },
];

const harvesterSearchesData = [
  { time: '00:00', searches: 5 },
  { time: '02:00', searches: 2 },
  { time: '04:00', searches: 3 },
  { time: '06:00', searches: 15 },
  { time: '08:00', searches: 45 },
  { time: '10:00', searches: 60 },
  { time: '12:00', searches: 75 },
  { time: '14:00', searches: 65 },
  { time: '16:00', searches: 80 },
  { time: '18:00', searches: 50 },
  { time: '20:00', searches: 35 },
];

const mapLocations = [
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, count: 450 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, count: 320 },
  { name: 'Nashik', lat: 20.0059, lng: 73.7629, count: 210 },
  { name: 'Aurangabad', lat: 19.8762, lng: 75.3433, count: 180 },
  { name: 'Amravati', lat: 20.9320, lng: 77.7523, count: 150 },
];

const recentEvents = [
  { id: 1, type: 'user', message: 'New user registered from Nagpur', time: '2 mins ago', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 2, type: 'harvester', message: 'John Deere harvester added', time: '15 mins ago', color: 'text-green-600', bg: 'bg-green-50' },
  { id: 3, type: 'operator', message: 'Operator profile verified', time: '1 hour ago', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 4, type: 'alert', message: 'Failed login attempt detected', time: '2 hours ago', color: 'text-amber-600', bg: 'bg-amber-50' },
];

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-800 font-sans p-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="font-semibold text-sm">System Online</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100 flex-1 sm:flex-none">
            <button 
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors flex-1 sm:flex-none ${activeTab === 'overview' ? 'bg-[#7fc241] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors flex-1 sm:flex-none ${activeTab === 'logs' ? 'bg-[#7fc241] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('logs')}
            >
              Activity Log
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-100px)]">
        
        {/* LEFT COLUMN - MAP (4 columns) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-none">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">State Focus</p>
                <button className="flex items-center gap-2 text-gray-900 font-bold hover:text-[#7fc241] transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#172263]"></span>
                  Maharashtra <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total Regions</p>
                <p className="font-bold text-gray-900 text-lg">5 Active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 relative min-h-[400px]">
            <MapContainer 
              center={[19.7515, 75.7139]} 
              zoom={6} 
              scrollWheelZoom={false} 
              style={{ height: '100%', width: '100%', zIndex: 0, background: '#f8f9fa' }}
            >
              <TileLayer
                attribution=''
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              />
              {mapLocations.map((loc, idx) => (
                <CircleMarker
                  key={idx}
                  center={[loc.lat, loc.lng]}
                  radius={Math.max(10, loc.count / 20)}
                  pathOptions={{
                    fillColor: '#7fc241',
                    fillOpacity: 0.3,
                    color: '#7fc241',
                    weight: 1
                  }}
                >
                  <CircleMarker
                    center={[loc.lat, loc.lng]}
                    radius={4}
                    pathOptions={{ fillColor: '#7fc241', fillOpacity: 1, color: '#fff', weight: 1 }}
                  />
                  <Popup className="rounded-lg shadow-sm border-0">
                    <div className="text-center p-1">
                      <h4 className="font-bold text-gray-900 mb-1">{loc.name}</h4>
                      <p className="text-[#7fc241] font-semibold">{loc.count} Users</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT COLUMN - INSIGHTS (8 columns) */}
        <div className="xl:col-span-8 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* Top Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Active Users Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="font-semibold text-sm">Active Users</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <h3 className="text-5xl font-bold text-[#7fc241]">137</h3>
                    <span className="text-sm font-bold text-gray-400 mb-1">USERS</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-gray-400 mb-1">Last update: 20:32</p>
                  <div className="flex items-center gap-2 text-gray-500 justify-end">
                    <span className="w-2 h-2 rounded-full bg-[#7fc241]"></span> Normal
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 justify-end mt-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Max
                  </div>
                </div>
              </div>
              
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeUsersData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7fc241" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#7fc241" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="users" stroke="#7fc241" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Searches Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Search className="w-4 h-4" />
                    <span className="font-semibold text-sm">Harvester Searches</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <h3 className="text-5xl font-bold text-[#7fc241]">35</h3>
                    <span className="text-sm font-bold text-gray-400 mb-1">REQ/HR</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-gray-400 mb-1">Last update: 20:32</p>
                  <div className="flex items-center gap-2 text-gray-500 justify-end">
                    <span className="w-2 h-2 rounded-full bg-[#7fc241]"></span> Normal
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 justify-end mt-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Max
                  </div>
                </div>
              </div>
              
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={harvesterSearchesData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7fc241" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#7fc241" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="searches" stroke="#7fc241" strokeWidth={2} fillOpacity={1} fill="url(#colorSearches)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>

          {/* Events & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Events List */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold text-sm">Recent Events</span>
                </div>
                <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
              
              <div className="space-y-3">
                {recentEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${event.color.replace('text-', 'bg-')}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{event.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold text-sm">System Status</span>
                </div>
                <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Database Connection</span>
                  <span className="px-3 py-1 bg-[#f0f9e8] text-[#7fc241] font-semibold rounded-md text-xs">Online</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">SMS Gateway</span>
                  <span className="px-3 py-1 bg-[#f0f9e8] text-[#7fc241] font-semibold rounded-md text-xs">Dispatched</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Translation API</span>
                  <span className="px-3 py-1 bg-[#f0f9e8] text-[#7fc241] font-semibold rounded-md text-xs">Operational</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Image Storage Server</span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 font-semibold rounded-md text-xs">Notified</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Push Notifications</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 font-semibold rounded-md text-xs">Triggered</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Key Metrics */}
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <h3 className="font-bold text-gray-800">Key Metrics</h3>
              <button className="text-xs text-gray-500 flex items-center gap-1 font-semibold hover:text-gray-700 bg-white px-2 py-1 rounded border border-gray-100">
                Last 24 Hours <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-2.5 bg-[#f0f9e8] text-[#7fc241] rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Total Users</p>
                  <p className="font-bold text-gray-900 text-lg">1,204 <span className="text-xs text-gray-400 font-normal">/ 24 Hrs</span></p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-2.5 bg-[#f0f9e8] text-[#7fc241] rounded-xl">
                  <Tractor className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Harvesters</p>
                  <p className="font-bold text-gray-900 text-lg">342 <span className="text-xs text-gray-400 font-normal">/ 24 Hrs</span></p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Operators</p>
                  <p className="font-bold text-gray-900 text-lg">189 <span className="text-xs text-gray-400 font-normal">/ 24 Hrs</span></p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Enquiries</p>
                  <p className="font-bold text-gray-900 text-lg">87 <span className="text-xs text-gray-400 font-normal">/ 24 Hrs</span></p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
