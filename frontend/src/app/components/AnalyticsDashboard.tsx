import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Users, MapPin, Activity, TrendingUp } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useNavigate } from 'react-router-dom';

// Fix for leaflet default icons in React
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

interface StateData {
  name: string;
  users: number;
}

interface CityData {
  name: string;
  users: number;
  lat: number;
  lng: number;
}

export function AnalyticsDashboard() {
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('tractorsewa_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch('/api/analytics/region', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await res.json();
        setStateData(data.stateData);
        setCityData(data.cityData);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
        setStateData([]);
        setCityData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-[#172263] rounded-full animate-spin" />
      </div>
    );
  }

  const totalUsers = stateData.reduce((acc, curr) => acc + curr.users, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">


      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <Activity size={20} className="shrink-0" />
            <div>
              <p className="font-bold text-sm">Analytics Sync Failed</p>
              <p className="text-xs">{error}. Showing empty dashboard until the API key is configured.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="p-4 bg-blue-50 rounded-xl">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Active Users</p>
              <h3 className="text-3xl font-bold text-gray-900">{totalUsers.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <MapPin className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">States Reached</p>
              <h3 className="text-3xl font-bold text-gray-900">{stateData.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="p-4 bg-purple-50 rounded-xl">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Top City</p>
              <h3 className="text-3xl font-bold text-gray-900 truncate max-w-[150px]">
                {cityData.length > 0 ? cityData[0].name : '-'}
              </h3>
            </div>
          </div>
        </div>

        {/* Maps Section */}
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">User Distribution Map</h2>
            <p className="text-sm text-gray-500">Showing top locations across India</p>
          </div>
          <div className="h-[500px] w-full z-0 relative">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              {cityData.map((city, index) => (
                <Marker key={index} position={[city.lat, city.lng]}>
                  <Popup className="rounded-lg shadow-sm">
                    <div className="text-center font-sans">
                      <h4 className="font-bold text-gray-900 mb-1">{city.name}</h4>
                      <p className="text-blue-600 font-semibold">{city.users.toLocaleString()} Users</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">State-wise Distribution</h2>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="users" name="Active Users" fill="#172263" radius={[4, 4, 0, 0]}>
                    {stateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Top Cities Breakdown</h2>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cityData.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="users"
                    nameKey="name"
                    labelLine={false}
                  >
                    {cityData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
