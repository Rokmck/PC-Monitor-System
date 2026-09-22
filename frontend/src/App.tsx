import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Activity, Cpu, Database, Zap, Bell, ShieldAlert } from 'lucide-react';

// 1. Data structure (TypeScript)
interface Metric {
  id: number;
  time: string;
  cpuLoad: number;
  cpuTemp: number;
  gpuLoad: number;
  gpuTemp: number;
  ramUsage: number;
}

interface AlertLog {
  id: number;
  time: string;
  component: string;
  status: string;
  message: string;
}

interface StatCardProps {
  title: string;
  usage: number;
  temp: number;
  icon: React.ReactNode;
}

export default function App() {
  const [data, setData] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [status, setStatus] = useState<'online' | 'offline'>('offline');

  // 2. Data synchronization via backend
  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        // fetch metrics and alerts at the same time
        const [resData, resAlerts] = await Promise.all([
          fetch('http://localhost:5000/data'),
          fetch('http://localhost:5000/alerts')
        ]);

        if (!resData.ok || !resAlerts.ok) throw new Error("API Error");

        const metricsJson = await resData.json();
        const alertsJson = await resAlerts.json();

        if (isMounted) {
          setData(metricsJson.reverse());
          setAlerts(alertsJson);
          setStatus('online');
        }
      } catch (err) {
        if (isMounted) setStatus('offline');
        console.error("Fetch error:", err);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 20000); // Update every 20 sec.

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const last = data[data.length - 1] || { cpuLoad: 0, cpuTemp: 0, gpuLoad: 0, gpuTemp: 0, ramUsage: 0 };

  // 3. Graph configuration
  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#161b22', borderWidth: 0, textStyle: { color: '#fff' } },
    legend: { data: ['CPU %', 'GPU %', 'RAM %'], textStyle: { color: '#8b949e' }, top: 0 },
    grid: { left: '2%', right: '2%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: data.map(d => new Date(d.time).toLocaleTimeString()),
      axisLabel: { color: '#8b949e', fontSize: 10 },
      axisLine: { lineStyle: { color: '#30363d' } }
    },
    yAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#30363d' } }, axisLabel: { color: '#8b949e' } },
    series: [
      { name: 'CPU %', type: 'line', smooth: true, showSymbol: false, data: data.map(d => d.cpuLoad), itemStyle: { color: '#3b82f6' } },
      { name: 'GPU %', type: 'line', smooth: true, showSymbol: false, data: data.map(d => d.gpuLoad), itemStyle: { color: '#a855f7' } },
      { name: 'RAM %', type: 'line', smooth: true, showSymbol: false, data: data.map(d => d.ramUsage), itemStyle: { color: '#10b981' } }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-xl"><Activity className="text-blue-500" size={32} /></div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">PC Monitor System v2</h1>
          </div>
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] ${status === 'online' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
            <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            {status}
          </div>
        </header>

        {/* Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Processor (CPU)" usage={last.cpuLoad} temp={last.cpuTemp} icon={<Cpu size={20} className="text-blue-500" />} />
          <StatCard title="Graphics (GPU)" usage={last.gpuLoad} temp={last.gpuTemp} icon={<Zap size={20} className="text-purple-500" />} />
          
          <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-3xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#8b949e]">Memory (RAM)</span>
              <Database size={18} className="text-emerald-500" />
            </div>
            <div className="text-5xl font-mono font-bold text-white mb-2">{last.ramUsage.toFixed(0)}%</div>
            <div className="w-full bg-[#30363d] h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${last.ramUsage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="bg-[#161b22] border border-[#30363d] p-8 rounded-3xl shadow-2xl mb-10">
          <div className="flex items-center gap-2 mb-8 border-b border-[#30363d] pb-4">
            <Activity size={18} className="text-blue-500" />
            <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Performance History</h2>
          </div>
          <ReactECharts option={chartOption} style={{ height: '350px' }} notMerge={true} />
        </div>

        {/* alert dashboard */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-[#30363d] flex items-center gap-3">
            <Bell size={18} className="text-yellow-500" />
            <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Alert History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0d1117] text-[#8b949e] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b border-[#30363d]">Time</th>
                  <th className="p-4 border-b border-[#30363d]">Component</th>
                  <th className="p-4 border-b border-[#30363d]">Status</th>
                  <th className="p-4 border-b border-[#30363d]">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]">
                {alerts.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center opacity-30 italic font-mono uppercase tracking-widest">No critical alerts detected</td></tr>
                ) : (
                  alerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-[#1c2128] transition-colors">
                      <td className="p-4 text-[#8b949e] font-mono">{new Date(alert.time).toLocaleTimeString()}</td>
                      <td className="p-4 font-bold flex items-center gap-2">
                        <ShieldAlert size={14} className={alert.status === 'Critical' ? 'text-red-500' : 'text-yellow-500'} />
                        {alert.component}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${alert.status === 'Critical' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="p-4 opacity-70 font-medium">{alert.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// Pagalbinė komponentė, rodanti atskirą statistikos kortelę
function StatCard({ title, usage, temp, icon }: StatCardProps) {
  const isHot = temp > 10;

  return (
    <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-3xl shadow-xl transition-all hover:border-[#444c56]">
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#8b949e]">{title}</span>
        {icon}
      </div>
      <div className="flex justify-between items-end">
        <div>
          <div className="text-5xl font-mono font-bold text-white leading-none">{usage.toFixed(0)}<span className="text-sm opacity-30 ml-1">%</span></div>
          <div className="text-[9px] uppercase font-black text-[#8b949e] mt-2 tracking-[0.2em]">Usage Load</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-mono font-bold ${isHot ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
            {temp.toFixed(0)}°C
          </div>
          <div className="text-[9px] uppercase font-black text-[#8b949e] mt-1 tracking-[0.2em]">Temp</div>
        </div>
      </div>
    </div>
  );
}


// last update 2026-09-15