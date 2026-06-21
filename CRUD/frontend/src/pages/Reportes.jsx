import React from 'react';
import { Download } from 'lucide-react';

const Reportes = () => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--success)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
          <Download size={24} />
        </div>
        <h2>Descargar Reporte</h2>
      </div>

      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <Download size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
        <h3>Módulo de Reportes en construcción</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Aquí podrás descargar un Excel unificado con todos los expedientes, cálculos de plazos y cruce de datos con universidades e indicadores.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '2rem' }}>
          Generar y Descargar Excel
        </button>
      </div>
    </div>
  );
};

export default Reportes;
