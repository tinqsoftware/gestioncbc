import React, { useState, useEffect } from 'react';
import { CalendarOff, Plus, Trash2, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

const Feriados = () => {
  const [holidays, setHolidays] = useState([]);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadHolidays = () => {
    fetch(`${API_URL}/holidays`)
      .then(res => res.json())
      .then(data => setHolidays(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  useEffect(() => { loadHolidays(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!date) { setError('Selecciona una fecha.'); return; }
    try {
      const res = await fetch(`${API_URL}/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, description })
      });
      if (res.ok) {
        setDate(''); setDescription('');
        loadHolidays();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo registrar el feriado.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    }
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/holidays/${id}`, { method: 'DELETE' });
    loadHolidays();
  };

  const formatDate = (d) => {
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const [y, m, day] = d.split('-');
    return new Date(y, m - 1, day).toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <CalendarOff size={24} color="var(--primary)" />
        <h2 style={{ margin: 0 }}>Feriados</h2>
      </div>
      <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Las fechas registradas aquí se descuentan del conteo de días hábiles al calcular los vencimientos ANP.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Formulario de alta */}
        <div className="modal-section">
          <div className="modal-section-title"><Plus size={15} /> Registrar feriado</div>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field">
              <span className="field-label">Fecha</span>
              <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="field">
              <span className="field-label">Descripción</span>
              <input type="text" className="form-control" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Día del Trabajo" />
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--danger)' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              <Plus size={18} /> Agregar feriado
            </button>
          </form>
        </div>

        {/* Listado */}
        <div className="modal-section">
          <div className="modal-section-title"><CalendarOff size={15} /> Feriados registrados ({holidays.length})</div>
          {holidays.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No hay feriados registrados aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {holidays.map(h => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.9rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{formatDate(h.date)}</div>
                    {h.description && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{h.description}</div>}
                  </div>
                  <button onClick={() => handleDelete(h.id)} title="Eliminar feriado"
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feriados;
