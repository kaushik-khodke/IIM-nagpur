import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  Users, Activity, Bell, Settings, Search, UserPlus,
  Tractor, MessageCircle, AlertTriangle, CheckCircle2, ChevronDown, Eye
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for leaflet default icons in React
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [locations, setLocations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalOperators: 0,
    totalHarvesters: 0,
    totalEnquiries: 0
  });
  const [charts, setCharts] = useState({
    newUsers: [],
    newHarvesters: []
  });
  const [events, setEvents] = useState<any[]>([]);
  const [activeRegions, setActiveRegions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [realtimeUsers, setRealtimeUsers] = useState(0);
  const [realtimeCities, setRealtimeCities] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch DB Stats (uses relative path — main.tsx global fetch override handles backend URL)
        const statsRes = await fetch(`/api/admin/dashboard-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setMetrics(statsData.metrics || { totalUsers: 0, totalOperators: 0, totalHarvesters: 0, totalEnquiries: 0 });
          setCharts(statsData.charts || { newUsers: [], newHarvesters: [] });
          setEvents(statsData.recentEvents || []);
        }

        // Fetch Google Analytics (Map data)
        const gaRes = await fetch(`/api/analytics/region`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (gaRes.ok) {
          const gaData = await gaRes.json();
          if (gaData.cityData && gaData.cityData.length > 0) {
            const newLocations = gaData.cityData.map((c: any) => ({
              name: c.name,
              lat: c.lat,
              lng: c.lng,
              count: c.users
            }));
            setLocations(newLocations);
          }
          if (gaData.stateData && gaData.stateData.length > 0) {
            setActiveRegions(gaData.stateData.length);
          }
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Poll realtime active users every 30 seconds
  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/analytics/realtime', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRealtimeUsers(data.activeUsers || 0);
          if (data.cityData && data.cityData.length > 0) {
            setRealtimeCities(data.cityData.map((c: any) => ({
              name: c.name,
              lat: c.lat,
              lng: c.lng,
              count: c.users,
              isLive: true
            })));
          } else {
            setRealtimeCities([]);
          }
        }
      } catch (err) {
        console.error('Realtime analytics error:', err);
      }
    };

    fetchRealtime();
    const interval = setInterval(fetchRealtime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-800 font-sans p-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="font-semibold text-sm">System Online</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <Eye className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-bold text-sm text-gray-900">{realtimeUsers}</span>
            <span className="font-semibold text-sm text-gray-500">Live</span>
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
                <p className="font-bold text-gray-900 text-lg">{loading ? '...' : activeRegions} Active</p>
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
              {/* Historical location markers (green) */}
              {locations.map((loc, idx) => (
                <CircleMarker
                  key={`hist-${idx}`}
                  center={[loc.lat, loc.lng]}
                  radius={Math.max(10, loc.count / 2)}
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
                      <p className="text-[#7fc241] font-semibold">{loc.count} Users (30 days)</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {/* Live visitor markers (orange pulsing) */}
              {realtimeCities.map((loc, idx) => (
                <CircleMarker
                  key={`live-${idx}`}
                  center={[loc.lat, loc.lng]}
                  radius={12}
                  pathOptions={{
                    fillColor: '#f97316',
                    fillOpacity: 0.4,
                    color: '#f97316',
                    weight: 2
                  }}
                >
                  <CircleMarker
                    center={[loc.lat, loc.lng]}
                    radius={5}
                    pathOptions={{ fillColor: '#f97316', fillOpacity: 1, color: '#fff', weight: 2 }}
                  />
                  <Popup className="rounded-lg shadow-sm border-0">
                    <div className="text-center p-1">
                      <h4 className="font-bold text-gray-900 mb-1">🔴 {loc.name}</h4>
                      <p className="text-orange-500 font-semibold">{loc.count} Live Now</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT COLUMN - INSIGHTS (8 columns) */}
        <div className="xl:col-span-8 flex flex-col gap-4 overflow-y-auto pr-1">

          {/* Key Metrics */}
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <h3 className="font-bold text-gray-800">Key Metrics</h3>
              <button className="text-xs text-gray-500 flex items-center gap-1 font-semibold hover:text-gray-700 bg-white px-2 py-1 rounded border border-gray-100">
                Total All Time <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-2.5 bg-[#f0f9e8] text-[#7fc241] rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Total Users</p>
                  <p className="font-bold text-gray-900 text-lg">{loading ? '...' : metrics.totalUsers}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-2.5 bg-[#f0f9e8] text-[#7fc241] rounded-xl">
                  <Tractor className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Harvesters</p>
                  <p className="font-bold text-gray-900 text-lg">{loading ? '...' : metrics.totalHarvesters}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Operators</p>
                  <p className="font-bold text-gray-900 text-lg">{loading ? '...' : metrics.totalOperators}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Enquiries</p>
                  <p className="font-bold text-gray-900 text-lg">{loading ? '...' : metrics.totalEnquiries}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">

            {/* Registrations Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="font-semibold text-sm">New Registrations</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <h3 className="text-3xl font-bold text-[#7fc241]">{charts.newUsers.reduce((a, b: any) => a + b.value, 0)}</h3>
                    <span className="text-sm font-bold text-gray-400 mb-1">LAST 7 DAYS</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="flex items-center gap-2 text-gray-500 justify-end">
                    <span className="w-2 h-2 rounded-full bg-[#7fc241]"></span> Users
                  </div>
                </div>
              </div>

              <div className="h-[140px] w-full">
                {charts.newUsers.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.newUsers} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7fc241" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#7fc241" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="value" stroke="#7fc241" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>
                )}
              </div>
            </div>

            {/* Harvesters Added Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Tractor className="w-4 h-4" />
                    <span className="font-semibold text-sm">New Harvesters</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <h3 className="text-3xl font-bold text-[#7fc241]">{charts.newHarvesters.reduce((a, b: any) => a + b.value, 0)}</h3>
                    <span className="text-sm font-bold text-gray-400 mb-1">LAST 7 DAYS</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="flex items-center gap-2 text-gray-500 justify-end">
                    <span className="w-2 h-2 rounded-full bg-[#7fc241]"></span> Harvesters
                  </div>
                </div>
              </div>

              <div className="h-[140px] w-full">
                {charts.newHarvesters.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.newHarvesters} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7fc241" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#7fc241" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="value" stroke="#7fc241" strokeWidth={2} fillOpacity={1} fill="url(#colorSearches)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>
                )}
              </div>
            </div>

          </div>

          {/* Events & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">

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
                {events.length > 0 ? events.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${event.bg.replace('bg-', 'bg-')}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{event.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{event.time}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 py-4 text-center">No recent activity found.</p>
                )}
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
                  <span className="text-gray-600">Google Analytics API</span>
                  <span className="px-3 py-1 bg-[#f0f9e8] text-[#7fc241] font-semibold rounded-md text-xs">Online</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Translation API</span>
                  <span className="px-3 py-1 bg-[#f0f9e8] text-[#7fc241] font-semibold rounded-md text-xs">Operational</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">SMS Gateway</span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 font-semibold rounded-md text-xs">Standby</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Image Storage</span>
                  <span className="px-3 py-1 bg-[#f0f9e8] text-[#7fc241] font-semibold rounded-md text-xs">Operational</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
