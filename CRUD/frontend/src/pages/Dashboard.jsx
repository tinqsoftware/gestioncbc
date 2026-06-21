import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { FileText, Clock, Archive, Share2, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config';

const PALETTE = ['#4361ee', '#4895ef', '#4cc9f0', '#f8961e', '#f72585', '#3f37c9', '#90be6d', '#577590'];

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, statuses: [], types: [], universities: [], byYear: [], byGestion: [], byCanal: [] });

  useEffect(() => {
    fetch(`${API_URL}/dashboard`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error fetching dashboard stats:", err));
  }, []);

  const statusCount = (name) => stats.statuses?.filter(s => s.status === name).reduce((a, c) => a + c.count, 0) || 0;

  const porActualizar = statusCount('Actualizar estado');

  const kpis = [
    { label: 'Total Expedientes', value: stats.total, color: 'var(--primary)', icon: <FileText size={20} /> },
    { label: 'En trámite', value: statusCount('En trámite'), color: 'var(--info)', icon: <Clock size={20} /> },
    { label: 'Archivo', value: statusCount('Archivo'), color: 'var(--warning)', icon: <Archive size={20} /> },
    { label: 'Derivado a UDRA', value: statusCount('Derivado a UDRA'), color: 'var(--secondary)', icon: <Share2 size={20} /> },
    { label: 'Por actualizar', value: porActualizar, color: 'var(--danger)', icon: <AlertTriangle size={20} />, highlight: porActualizar > 0 },
  ];

  // --- Chart configs ---
  const donut = (labels) => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels,
    colors: PALETTE,
    legend: { position: 'bottom' },
    dataLabels: { enabled: true },
    plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'Total' } } } } }
  });

  const hBar = (categories) => ({
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: false } },
    dataLabels: { enabled: true },
    xaxis: { categories },
    colors: ['#4361ee']
  });

  const vBar = (categories) => ({
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
    dataLabels: { enabled: true },
    xaxis: { categories },
    colors: ['#4895ef']
  });

  const ChartCard = ({ title, hasData, children }) => (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' }}>{title}</h3>
      {hasData ? children : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay datos suficientes para mostrar el gráfico.</p>}
    </div>
  );

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Resumen General</h2>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: k.highlight ? '1px solid var(--danger)' : undefined, background: k.highlight ? 'rgba(247,37,133,0.05)' : undefined }}>
            <div style={{ backgroundColor: k.color, width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              {k.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-muted)', fontWeight: 600 }}>{k.label}</h3>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: k.highlight ? 'var(--danger)' : 'var(--text-main)' }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Row 2: 3 charts */}
        <div className="charts-grid-3">
          <ChartCard title="Expedientes por Tipo ANP" hasData={stats.types?.length > 0}>
            <Chart options={donut(stats.types?.map(t => t.type_anp || 'Desconocido') || [])} series={stats.types?.map(t => t.count) || []} type="donut" height={320} />
          </ChartCard>

          <ChartCard title="Evolución por Año" hasData={stats.byYear?.length > 0}>
            <Chart options={vBar(stats.byYear?.map(y => String(y.year)) || [])} series={[{ name: 'Expedientes', data: stats.byYear?.map(y => y.count) || [] }]} type="bar" height={320} />
          </ChartCard>

          <ChartCard title="Tipo de Gestión" hasData={stats.byGestion?.length > 0}>
            <Chart options={donut(stats.byGestion?.map(g => g.tipo_gestion) || [])} series={stats.byGestion?.map(g => g.count) || []} type="donut" height={320} />
          </ChartCard>
        </div>

        {/* Row 3: 2 charts */}
        <div className="charts-grid-2">
          <ChartCard title="Expedientes por Canal de Origen" hasData={stats.byCanal?.length > 0}>
            <Chart options={hBar(stats.byCanal?.map(c => c.canal_origen) || [])} series={[{ name: 'Expedientes', data: stats.byCanal?.map(c => c.count) || [] }]} type="bar" height={320} />
          </ChartCard>

          <ChartCard title="Expedientes por Universidad (Top 10)" hasData={stats.universities?.length > 0}>
            <Chart options={hBar(stats.universities?.map(u => u.Siglas) || [])} series={[{ name: 'Expedientes', data: stats.universities?.map(u => u.count) || [] }]} type="bar" height={380} />
          </ChartCard>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
