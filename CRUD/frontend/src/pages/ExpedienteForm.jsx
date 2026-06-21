import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Layers, FlagTriangleRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { TIPO_ANP, COMPLEJIDAD, ESTADO, COMPROMETIDO } from '../constants/options';
import { API_URL } from '../config';

const ExpedienteForm = () => {
  const navigate = useNavigate();

  const [universidades, setUniversidades] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [opcionesDB, setOpcionesDB] = useState({ canales: [], prioridades: [], responsables: [] });
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    internal_id: '',
    year: new Date().getFullYear(),
    type_anp: 'SNP',
    university: '',
    tipo_gestion: '',
    codigo_indicador: '',
    priority: '',
    status: 'En trámite',
    facts: '',
    observations: ''
  });

  useEffect(() => {
    // Fetch catalogs
    fetch(`${API_URL}/catalogs/universidades`)
      .then(res => res.json())
      .then(data => setUniversidades(data))
      .catch(err => console.error(err));

    fetch(`${API_URL}/catalogs/indicadores`)
      .then(res => res.json())
      .then(data => setIndicadores(data))
      .catch(err => console.error(err));

    fetch(`${API_URL}/catalogs/opciones`)
      .then(res => res.json())
      .then(data => setOpcionesDB(data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'university') {
      const selectedUni = universidades.find(u => u.Nombre === value);
      if (selectedUni) {
        setFormData(prev => ({
          ...prev,
          university: selectedUni.Nombre,
          tipo_gestion: selectedUni.TipoGestion
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          tipo_gestion: ''
        }));
      }
    }
  };

  const handleCBCToggle = (cbc, isChecked) => {
    let current = formData.cbc ? formData.cbc.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (isChecked) {
      if (!current.includes(cbc)) current.push(cbc);
    } else {
      current = current.filter(c => c !== cbc);
    }
    setFormData(prev => ({ ...prev, cbc: current.join(', ') }));
  };

  const handleIndicadorToggle = (nro, isChecked) => {
    let current = formData.codigo_indicador ? String(formData.codigo_indicador).split(',').map(s => s.trim()).filter(Boolean) : [];
    const nroStr = String(nro);
    if (isChecked) {
      if (!current.includes(nroStr)) current.push(nroStr);
    } else {
      current = current.filter(c => c !== nroStr);
    }
    setFormData(prev => ({ ...prev, codigo_indicador: current.join(', ') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`${API_URL}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFeedback({ type: 'success', text: 'Expediente creado con éxito. Redirigiendo...' });
        setTimeout(() => navigate('/expedientes'), 1000);
      } else {
        setSaving(false);
        setFeedback({ type: 'error', text: 'No se pudo guardar el expediente. Revisa los datos e inténtalo de nuevo.' });
      }
    } catch (error) {
      console.error(error);
      setSaving(false);
      setFeedback({ type: 'error', text: 'Error de conexión con el servidor. ¿Está encendido el backend?' });
    }
  };

  const reqMark = <span style={{ color: 'var(--danger)' }}> *</span>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button type="button" className="btn" onClick={() => navigate('/expedientes')} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div>
          <h2 style={{ margin: 0 }}>Nuevo Expediente</h2>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Completa los datos. Los campos con <span style={{ color: 'var(--danger)' }}>*</span> son obligatorios.</p>
        </div>
      </div>

      {feedback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.85rem 1.1rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem', fontWeight: 500,
          border: `1px solid ${feedback.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          background: feedback.type === 'success' ? 'rgba(76,201,240,0.12)' : 'rgba(247,37,133,0.1)',
          color: feedback.type === 'success' ? 'var(--secondary)' : 'var(--danger)'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Identificación */}
        <div className="modal-section">
          <div className="modal-section-title"><FileText size={15} /> Identificación</div>
          <div className="field-grid">
            <div className="field">
              <span className="field-label">Tipo ANP{reqMark}</span>
              <select name="type_anp" className="form-control" value={formData.type_anp || ''} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                {TIPO_ANP.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Nro Expediente{reqMark}</span>
              <input type="text" name="internal_id" className="form-control" value={formData.internal_id || ''} onChange={handleChange} required placeholder="Ej: AD-005-2026" />
            </div>
            <div className="field">
              <span className="field-label">Nro Expediente SUNGED</span>
              <input type="text" name="nro_expediente_sunged" className="form-control" value={formData.nro_expediente_sunged || ''} onChange={handleChange} />
            </div>
            <div className="field">
              <span className="field-label">Canal de Origen</span>
              <select name="canal_origen" className="form-control" value={formData.canal_origen || ''} onChange={handleChange}>
                <option value="">Seleccione...</option>
                {opcionesDB.canales.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Año{reqMark}</span>
              <input type="number" name="year" className="form-control" value={formData.year || ''} onChange={handleChange} required />
            </div>
            <div className="field">
              <span className="field-label">Universidad{reqMark}</span>
              <input list="new-universidades-list" name="university" className="form-control" value={formData.university || ''} onChange={handleChange} required placeholder="Buscar universidad..." />
              <datalist id="new-universidades-list">
                {universidades.map(u => (
                  <option key={u.IdUniversidad} value={u.Nombre}>{u.Nombre} ({u.Siglas})</option>
                ))}
              </datalist>
            </div>
            <div className="field">
              <span className="field-label">Tipo de Gestión</span>
              <input type="text" name="tipo_gestion" className="form-control" value={formData.tipo_gestion || ''} readOnly placeholder="Se completa al elegir universidad" />
            </div>
          </div>
        </div>

        {/* Clasificación */}
        <div className="modal-section">
          <div className="modal-section-title"><Layers size={15} /> Clasificación</div>
          <div className="field-grid">
            <div className="field">
              <span className="field-label">Modelo</span>
              <select className="form-control" name="modelo" value={formData.modelo || ''} onChange={handleChange}>
                <option value="">Seleccione...</option>
                {[...new Set(indicadores.map(i => i.Modelo).filter(Boolean))].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <span className="field-label">CBC</span>
              <div className="check-list">
                {[...new Set(indicadores.filter(i => !formData.modelo || formData.modelo === i.Modelo).map(i => i.CBC).filter(Boolean))].map(c => {
                  const isChecked = formData.cbc && formData.cbc.split(',').map(s=>s.trim()).includes(c);
                  return (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                      <input type="checkbox" checked={!!isChecked} onChange={e => handleCBCToggle(c, e.target.checked)} />
                      {c}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <span className="field-label">Indicador(es)</span>
              <div className="check-list">
                {(() => {
                  const filtered = indicadores.filter(i => {
                    const matchesModelo = !formData.modelo || formData.modelo === i.Modelo;
                    const selectedCBCs = formData.cbc ? formData.cbc.split(',').map(s=>s.trim()) : [];
                    const matchesCBC = selectedCBCs.length === 0 || selectedCBCs.includes(i.CBC);
                    return matchesModelo && matchesCBC;
                  });
                  const unique = [];
                  const seen = new Set();
                  for (const ind of filtered) {
                    if (!seen.has(ind.NroIndicador)) {
                      seen.add(ind.NroIndicador);
                      unique.push(ind);
                    }
                  }
                  return unique.sort((a, b) => a.NroIndicador - b.NroIndicador).map(i => {
                    const isChecked = formData.codigo_indicador && String(formData.codigo_indicador).split(',').map(s=>s.trim()).includes(String(i.NroIndicador));
                    return (
                      <label key={`${i.Modelo}_${i.NroIndicador}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 600, marginRight: '1rem', marginBottom: '0.5rem' }}>
                        <input type="checkbox" checked={!!isChecked} onChange={e => handleIndicadorToggle(i.NroIndicador, e.target.checked)} />
                        {i.NroIndicador}
                      </label>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="field">
              <span className="field-label">Comprometido en plan</span>
              <select name="comprometido_plan_2026" className="form-control" value={formData.comprometido_plan_2026 || ''} onChange={handleChange}>
                <option value="">Seleccione...</option>
                {COMPROMETIDO.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Detalle del caso */}
        <div className="modal-section">
          <div className="modal-section-title"><FlagTriangleRight size={15} /> Detalle del caso</div>
          <div className="field-grid">
            <div className="field full">
              <span className="field-label">Hechos denunciados / Materia</span>
              <textarea name="facts" className="form-control" value={formData.facts || ''} onChange={handleChange} rows="4" />
            </div>
            <div className="field">
              <span className="field-label">Complejidad</span>
              <select name="complejidad" className="form-control" value={formData.complejidad || ''} onChange={handleChange}>
                <option value="">Seleccione...</option>
                {COMPLEJIDAD.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Prioridad</span>
              <select name="priority" className="form-control" value={formData.priority || ''} onChange={handleChange}>
                <option value="">Seleccione...</option>
                {opcionesDB.prioridades.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Responsable</span>
              <input list="new-responsables-list" name="profesional_asignado" className="form-control" value={formData.profesional_asignado || ''} onChange={handleChange} placeholder="Escribir o seleccionar..." />
              <datalist id="new-responsables-list">
                {opcionesDB.responsables.map(r => <option key={r} value={r}>{r}</option>)}
              </datalist>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Estado inicio ANP</span>
              <select name="status" className="form-control" style={{ width: 'auto', padding: '0.6rem 3rem 0.6rem 1.5rem', fontSize: '1rem', height: 'auto', fontWeight: 700, color: 'var(--text-main)', borderColor: 'var(--primary)', borderRadius: '30px', backgroundColor: 'var(--bg-color)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }} value={formData.status || ''} onChange={handleChange}>
                <option value="Archivo">Archivo</option>
                <option value="Derivado a UDRA">Derivado a UDRA</option>
                <option value="En trámite">En trámite</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn modal-btn-ghost" onClick={() => navigate('/expedientes')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Expediente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpedienteForm;
