import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download, ChevronLeft, ChevronRight, X, ClipboardList, FileText, Layers, MessageSquare, FlagTriangleRight, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { TIPO_ANP, COMPLEJIDAD, ESTADO, COMPROMETIDO } from '../constants/options';
import { API_URL } from '../config';

const Expedientes = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [selectedSeguimiento, setSelectedSeguimiento] = useState(null);
  const [showSeguimientoPanel, setShowSeguimientoPanel] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  
  // Catalogs
  const [universidades, setUniversidades] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [opcionesDB, setOpcionesDB] = useState({ canales: [], prioridades: [], responsables: [] });
  const [holidays, setHolidays] = useState([]); // lista de fechas 'YYYY-MM-DD'

  // Filters
  const [filterYear, setFilterYear] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' = más nuevos primero, 'asc' = más antiguos primero

  useEffect(() => {
    fetch(`${API_URL}/files`)
      .then(res => res.json())
      .then(data => setFiles(data))
      .catch(err => console.error(err));

    fetch(`${API_URL}/catalogs/universidades`).then(res => res.json()).then(data => setUniversidades(data));
    fetch(`${API_URL}/catalogs/indicadores`).then(res => res.json()).then(data => setIndicadores(data));
    fetch(`${API_URL}/catalogs/opciones`).then(res => res.json()).then(data => setOpcionesDB(data));
    fetch(`${API_URL}/holidays`).then(res => res.json()).then(data => setHolidays(Array.isArray(data) ? data.map(h => h.date) : []));
  }, []);

  const openModal = (file) => {
    setSelectedExpediente(file);
    setFormData({ ...file });
    setIsEditing(false);
  };

  const openSeguimiento = (file) => {
    setSelectedSeguimiento(file);
    setFormData({ ...file });
    setIsEditing(false);
    const hasData = !!(file.seg_anp_documento || file.seg_anp_estado || file.observations || file.seg_anp_ultima_actuacion);
    setShowSeguimientoPanel(hasData);
  };

  const handleSave = () => {
    fetch(`${API_URL}/files/${formData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(() => {
      fetch(`${API_URL}/files`)
        .then(res => res.json())
        .then(data => {
          setFiles(data);
          setSelectedExpediente(null);
          setSelectedSeguimiento(null);
        });
    })
    .catch(err => console.error(err));
  };

  const handleDelete = () => {
    if (window.confirm('¿Está seguro de que desea eliminar este expediente? Esta acción no se puede deshacer.')) {
      fetch(`${API_URL}/files/${formData.id}`, {
        method: 'DELETE'
      })
      .then(res => res.json())
      .then(() => {
        fetch(`${API_URL}/files`)
          .then(res => res.json())
          .then(data => {
            setFiles(data);
            setSelectedExpediente(null);
            setSelectedSeguimiento(null);
          });
      })
      .catch(err => console.error(err));
    }
  };

  const handleUniversidadChange = (uniName) => {
    const uni = universidades.find(u => u.Nombre === uniName);
    if (uni) {
      setFormData(prev => ({
        ...prev,
        university: uni.Nombre,
        id_universidad: uni.IdUniversidad,
        tipo_gestion: uni.TipoGestion
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        university: uniName,
        id_universidad: null,
        tipo_gestion: ''
      }));
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

  const normalizeStr = (str) => {
    return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const filteredFiles = files.filter(f => {
    const searchNormalized = normalizeStr(searchTerm);
    const matchesSearch = (f.internal_id && normalizeStr(String(f.internal_id)).includes(searchNormalized)) ||
                          (f.nro_expediente_sunged && normalizeStr(String(f.nro_expediente_sunged)).includes(searchNormalized)) ||
                          (f.university && normalizeStr(String(f.university)).includes(searchNormalized)) ||
                          (f.canal_origen && normalizeStr(String(f.canal_origen)).includes(searchNormalized));
    
    const matchesYear = filterYear === "" || String(f.year) === filterYear;
    const matchesType = filterType === "" || f.type_anp === filterType;
    const matchesStatus = filterStatus === "" || f.status === filterStatus;
    const matchesPriority = filterPriority === "" || f.priority === filterPriority;

    return matchesSearch && matchesYear && matchesType && matchesStatus && matchesPriority;
  });

  const handleExport = () => {
    const exportData = filteredFiles.map(f => ({
      "ID Sistema": f.id,
      "Año": f.year,
      "Tipo ANP": f.type_anp,
      "Canal Origen": f.canal_origen,
      "Nro Expediente": f.internal_id,
      "Universidad": f.university,
      "Tipo Gestión": f.tipo_gestion,
      "Código Local": f.codigo_local,
      "Modelo": f.modelo,
      "CBC": f.cbc,
      "Indicador": f.codigo_indicador,
      "Prioridad": f.priority,
      "Complejidad": f.complejidad,
      "Estado": f.status,
      "Profesional Asignado": f.profesional_asignado,
      "Hechos": f.facts,
      "Productos Esperados": f.productos,
      "Historial de Comentarios": f.historial_comentarios ? (() => {
        try {
          return JSON.parse(f.historial_comentarios).map(c => `[${c.date}] ${c.text}`).join('\n\n');
        } catch { return f.historial_comentarios; }
      })() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expedientes");
    XLSX.writeFile(wb, "Reporte_Expedientes.xlsx");
  };

  // Ordena por id (orden de registro): desc = más nuevos primero, asc = más antiguos primero
  const sortedFiles = [...filteredFiles].sort((a, b) => sortOrder === 'asc' ? a.id - b.id : b.id - a.id);

  // Pagination logic
  const totalPages = Math.ceil(sortedFiles.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedFiles = sortedFiles.slice(startIndex, startIndex + pageSize);

  // Reset page when search, page size or sort order changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, sortOrder]);

  const renderField = (field, type = 'text') => {
    if (!isEditing) {
      const val = formData[field];
      const isEmpty = val === null || val === undefined || val === '';
      const cls = `field-value${type === 'textarea' ? ' block' : ''}${isEmpty ? ' empty' : ''}`;
      return <div className={cls}>{isEmpty ? '—' : val}</div>;
    }
    
    if (field === 'type_anp') {
      return (
        <select className="form-control" value={formData.type_anp || ''} onChange={e => setFormData({...formData, type_anp: e.target.value})}>
          <option value="">Seleccione...</option>
          {TIPO_ANP.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      );
    }
    if (field === 'status') {
      // Incluye el valor actual si no es uno de los 3 canónicos (ej. "Actualizar estado")
      const opts = (formData.status && !ESTADO.includes(formData.status)) ? [formData.status, ...ESTADO] : ESTADO;
      return (
        <select className="form-control" value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})}>
          <option value="">Seleccione...</option>
          {opts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      );
    }
    if (field === 'comprometido_plan_2026') {
      return (
        <select className="form-control" value={formData.comprometido_plan_2026 || ''} onChange={e => setFormData({...formData, comprometido_plan_2026: e.target.value})}>
          <option value="">Seleccione...</option>
          {COMPROMETIDO.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      );
    }
    if (field === 'complejidad') {
      return (
        <select className="form-control" value={formData.complejidad || ''} onChange={e => setFormData({...formData, complejidad: e.target.value})}>
          <option value="">Seleccione...</option>
          {COMPLEJIDAD.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      );
    }
    if (field === 'priority') {
      return (
        <select className="form-control" value={formData.priority || ''} onChange={e => setFormData({...formData, priority: e.target.value})}>
          <option value="">Seleccione...</option>
          {opcionesDB.prioridades.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      );
    }
    if (field === 'profesional_asignado') {
      return (
        <>
          <input 
            list="edit-responsables-list" 
            className="form-control" 
            value={formData[field] || ''} 
            onChange={e => setFormData({...formData, [field]: e.target.value})} 
            placeholder="Escribir o seleccionar..." 
          />
          <datalist id="edit-responsables-list">
            {opcionesDB.responsables.map(r => <option key={r} value={r}>{r}</option>)}
          </datalist>
        </>
      );
    }

    if (field === 'canal_origen') {
      return (
        <select className="form-control" value={formData.canal_origen || ''} onChange={e => setFormData({...formData, canal_origen: e.target.value})}>
          <option value="">Seleccione...</option>
          {opcionesDB.canales.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      );
    }
    
    if (type === 'textarea') {
      return <textarea className="form-control" value={formData[field] || ''} onChange={e => setFormData({...formData, [field]: e.target.value})} rows={4} style={{ width: '100%', padding: '0.5rem', fontFamily: 'inherit' }} />;
    }

    return <input type={type} className="form-control" value={formData[field] || ''} onChange={e => setFormData({...formData, [field]: e.target.value})} />;
  };

  // Labelled field wrapper (label + editable/read-only control)
  const labeled = (label, field, type = 'text', full = false) => (
    <div className={`field${full ? ' full' : ''}`}>
      <span className="field-label">{label}</span>
      {renderField(field, type)}
    </div>
  );

  // Read-only field (always shown as a value chip, even in edit mode)
  const readOnlyField = (label, value, full = false) => {
    const isEmpty = value === null || value === undefined || value === '';
    return (
      <div className={`field${full ? ' full' : ''}`}>
        <span className="field-label">{label}</span>
        <div className={`field-value${isEmpty ? ' empty' : ''}`}>{isEmpty ? '—' : value}</div>
      </div>
    );
  };

  // ---- Cálculo de días hábiles (descuenta sábados, domingos y feriados) ----
  const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isValidDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

  const addBusinessDays = (startStr, businessDays) => {
    const [y, m, d] = startStr.split('-').map(Number);
    let date = new Date(y, m - 1, d);
    let added = 0;
    while (added < businessDays) {
      date.setDate(date.getDate() + 1);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6 && !holidays.includes(isoDate(date))) added++;
    }
    return isoDate(date);
  };

  // Al cambiar la fecha de notificación o los días hábiles, recalcula el vencimiento de la fase
  const handleAnpDateChange = (phase, field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      const notif = next[`${phase}_fecha_notif`];
      const dias = parseInt(next[`${phase}_dias_habiles`], 10);
      next[`${phase}_fecha_venc`] = (isValidDate(notif) && Number.isInteger(dias) && dias > 0)
        ? addBusinessDays(notif, dias)
        : '';
      return next;
    });
  };

  // Campo de fecha (calendario) para la notificación
  const anpDateField = (label, phase) => {
    const field = `${phase}_fecha_notif`;
    const val = formData[field];
    return (
      <div className="field">
        <span className="field-label">{label}</span>
        {!isEditing
          ? <div className={`field-value${isValidDate(val) ? '' : ' empty'}`}>{isValidDate(val) ? val : '—'}</div>
          : <input type="date" className="form-control" value={isValidDate(val) ? val : ''} onChange={e => handleAnpDateChange(phase, field, e.target.value)} />}
      </div>
    );
  };

  // Campo de días hábiles (solo número)
  const anpDiasField = (label, phase) => {
    const field = `${phase}_dias_habiles`;
    const val = formData[field];
    const isEmpty = val === null || val === undefined || val === '';
    return (
      <div className="field">
        <span className="field-label">{label}</span>
        {!isEditing
          ? <div className={`field-value${isEmpty ? ' empty' : ''}`}>{isEmpty ? '—' : val}</div>
          : <input type="number" min="0" className="form-control" value={isEmpty ? '' : val} onChange={e => handleAnpDateChange(phase, field, e.target.value)} />}
      </div>
    );
  };

  // Campo de vencimiento (siempre calculado, solo lectura)
  const anpVencField = (label, phase) => {
    const val = formData[`${phase}_fecha_venc`];
    return (
      <div className="field">
        <span className="field-label">{label}</span>
        <div className={`field-value${isValidDate(val) ? '' : ' empty'}`} title="Calculado por días hábiles, descontando feriados">{isValidDate(val) ? val : '—'}</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Registro de Expedientes</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleExport} style={{ backgroundColor: 'var(--success)' }}>
            <Download size={18} /> Exportar Excel
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/expedientes/nuevo')}>
            <Plus size={18} /> Nuevo Expediente
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', flex: 1, minWidth: '250px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por Expediente, Universidad..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select className="form-control compact" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="">Todos los años</option>
              {[...new Set(files.map(f => f.year))].filter(Boolean).sort((a,b) => b - a).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <select className="form-control compact" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Todos los tipos</option>
              {[...new Set(files.map(f => f.type_anp))].filter(Boolean).sort().map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            <select className="form-control compact" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              {[...new Set(files.map(f => f.status))].filter(Boolean).sort().map(est => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>

            <select className="form-control compact" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">Todas las prioridades</option>
              {[...new Set(files.map(f => f.priority))].filter(Boolean).sort().map(pri => (
                <option key={pri} value={pri}>{pri}</option>
              ))}
            </select>

            <select className="form-control compact" value={sortOrder} onChange={e => setSortOrder(e.target.value)} title="Orden de los registros">
              <option value="desc">Más nuevos primero</option>
              <option value="asc">Más antiguos primero</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Mostrar:</span>
            <select
              className="form-control compact"
              style={{ minWidth: 'auto' }}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={999999}>Todos</option>
            </select>
            <span style={{ color: 'var(--text-muted)' }}>filas</span>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '5%' }}>Año</th>
                <th style={{ width: '10%' }}>Tipo ANP</th>
                <th style={{ width: '11%' }}>Canal Origen</th>
                <th style={{ width: '14%' }}>Nro Expediente</th>
                <th style={{ width: '19%' }}>Universidad</th>
                <th style={{ width: '5%' }}>CBC</th>
                <th style={{ width: '15%' }}>Productos</th>
                <th style={{ width: '10%' }}>Estado</th>
                <th style={{ width: '9%', textAlign: 'center' }}>Seguimiento</th>
                <th style={{ width: '8%', textAlign: 'center' }}>DETALLE</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFiles.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron expedientes</td>
                </tr>
              ) : (
                paginatedFiles.map(file => (
                  <tr key={file.id}>
                    <td>{file.year}</td>
                    <td><span className="badge badge-info">{file.type_anp}</span></td>
                    <td><div className="line-clamp-3">{file.canal_origen}</div></td>
                    <td style={{ fontWeight: 500 }}><div className="line-clamp-3">{file.internal_id}</div></td>
                    <td><div className="line-clamp-3">{file.university || 'No asignado'}</div></td>
                    <td><span className="badge badge-success">{file.cbc}</span></td>
                    <td style={{ fontSize: '0.8125rem' }}><div className="line-clamp-3">{file.productos}</div></td>
                    <td>
                      <span className={`badge ${
                        file.status === 'Archivo' ? 'badge-status-archivo' : 
                        file.status === 'Derivado a UDRA' ? 'badge-status-derivado' : 
                        file.status === 'En trámite' ? 'badge-status-tramite' : 'badge-primary'
                      }`}>
                        {file.status || 'Registrado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => openSeguimiento(file)}
                        className="btn"
                        style={{ padding: '0.35rem', background: 'var(--bg-color)', color: 'var(--info)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        title="Ver Seguimiento ANP"
                      >
                        <ClipboardList size={16} />
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => openModal(file)}
                        className="btn"
                        style={{ padding: '0.35rem', background: 'var(--bg-color)', color: 'var(--primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        title="Ver Expediente"
                      >
                        <Search size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Mostrando {Math.min(startIndex + 1, filteredFiles.length)} a {Math.min(startIndex + pageSize, filteredFiles.length)} de {filteredFiles.length} registros
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn" 
              style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', padding: '0 0.5rem' }}>
              Página {currentPage} de {totalPages}
            </span>
            <button 
              className="btn" 
              style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Expediente Details */}
      {selectedExpediente && (
        <div className="modal-overlay" onClick={() => setSelectedExpediente(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 className="modal-title">
                  <FileText size={20} color="var(--primary)" />
                  Expediente <span className="pill">{selectedExpediente.internal_id || '—'}</span>
                </h3>
                <p className="modal-sub">{selectedExpediente.university || 'Universidad no asignada'}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  {isEditing ? (
                    <select className="form-control" style={{ width: 'auto', padding: '0.5rem 2.5rem 0.5rem 1.25rem', fontSize: '0.95rem', height: 'auto', fontWeight: 700, color: 'var(--text-main)', borderColor: 'var(--primary)', borderRadius: '25px', backgroundColor: 'var(--bg-color)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }} value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="En trámite">En trámite</option>
                      <option value="Archivo">Archivo</option>
                      <option value="Derivado a UDRA">Derivado a UDRA</option>
                    </select>
                  ) : (
                    <span className={`badge ${
                      formData.status === 'Archivo' ? 'badge-status-archivo' : 
                      formData.status === 'Derivado a UDRA' ? 'badge-status-derivado' : 
                      formData.status === 'En trámite' ? 'badge-status-tramite' : 'badge-primary'
                    }`} style={{ fontSize: '0.95rem', padding: '0.5rem 1.25rem', borderRadius: '25px' }}>
                      {formData.status || 'Registrado'}
                    </span>
                  )}
                </div>
                <button className="modal-close" onClick={() => setSelectedExpediente(null)} title="Cerrar"><X size={20} /></button>
              </div>
            </div>

            <div className="modal-body">
              {/* Identificación */}
              <div className="modal-section">
                <div className="modal-section-title"><FileText size={15} /> Identificación</div>
                <div className="field-grid">
                  {labeled('Tipo ANP', 'type_anp')}
                  {labeled('Nro Expediente', 'internal_id')}
                  {labeled('Nro Expediente SUNGED', 'nro_expediente_sunged')}
                  {labeled('Canal de Origen', 'canal_origen')}
                  {labeled('Año', 'year', 'number')}
                  <div className="field">
                    <span className="field-label">Universidad</span>
                    {!isEditing ? (
                      <div className={`field-value${formData.university ? '' : ' empty'}`}>{formData.university || '—'}</div>
                    ) : (
                      <>
                        <input list="universidades-list" className="form-control" value={formData.university || ''} onChange={e => handleUniversidadChange(e.target.value)} placeholder="Buscar universidad..." />
                        <datalist id="universidades-list">
                          {universidades.map(u => <option key={u.IdUniversidad} value={u.Nombre}>{u.Nombre}</option>)}
                        </datalist>
                      </>
                    )}
                  </div>
                  {labeled('Tipo de Gestión', 'tipo_gestion')}
                </div>
              </div>

              {/* Clasificación */}
              <div className="modal-section">
                <div className="modal-section-title"><Layers size={15} /> Clasificación</div>
                <div className="field-grid">
                  <div className="field">
                    <span className="field-label">Modelo</span>
                    {!isEditing ? (
                      <div className={`field-value${formData.modelo ? '' : ' empty'}`}>{formData.modelo || '—'}</div>
                    ) : (
                      <select className="form-control" value={formData.modelo || ''} onChange={e => setFormData({...formData, modelo: e.target.value})}>
                        <option value="">Seleccione...</option>
                        {[...new Set(indicadores.map(i => i.Modelo).filter(Boolean))].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="field">
                    <span className="field-label">CBC</span>
                    {!isEditing ? (
                      <div className={`field-value${formData.cbc ? '' : ' empty'}`}>{formData.cbc || '—'}</div>
                    ) : (
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
                    )}
                  </div>

                  <div className="field">
                    <span className="field-label">Indicador(es)</span>
                    {!isEditing ? (
                      <div className={`field-value${formData.codigo_indicador ? '' : ' empty'}`}>{formData.codigo_indicador || '—'}</div>
                    ) : (
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
                    )}
                  </div>

                  {labeled('Comprometido en plan', 'comprometido_plan_2026')}
                </div>
              </div>

              {/* Detalle del caso */}
              <div className="modal-section">
                <div className="modal-section-title"><FlagTriangleRight size={15} /> Detalle del caso</div>
                <div className="field-grid">
                  {labeled('Hechos Denunciados', 'facts', 'textarea', true)}
                  {labeled('Complejidad', 'complejidad')}
                  {labeled('Prioridad', 'priority')}
                  {labeled('Responsable', 'profesional_asignado')}
                </div>
              </div>

              {/* Comentarios */}
              <div className="modal-section">
                <div className="modal-section-title"><MessageSquare size={15} /> Comentarios</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="comment-list">
                    {(() => {
                      let comments = [];
                      try { comments = formData.historial_comentarios ? JSON.parse(formData.historial_comentarios) : []; } catch(e) {}

                      if (comments.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay comentarios aún.</span>;

                      return comments.map(c => (
                        <div key={c.id} className="comment-item">
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.25rem' }}>{c.date}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{c.text}</div>
                          {isEditing && (
                            <button
                              onClick={() => {
                                const newArr = comments.filter(x => x.id !== c.id);
                                setFormData({...formData, historial_comentarios: JSON.stringify(newArr)});
                              }}
                              style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                              title="Eliminar Comentario"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {isEditing && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <textarea
                        id="new-comment-box"
                        className="form-control"
                        placeholder="Escribe un nuevo comentario..."
                        rows={3}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className="btn"
                          style={{ background: 'var(--info)', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}
                          onClick={() => {
                            const input = document.getElementById('new-comment-box');
                            if (!input.value.trim()) return;
                            const dateStr = new Date().toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

                            let currentArr = [];
                            try { currentArr = formData.historial_comentarios ? JSON.parse(formData.historial_comentarios) : []; } catch(e) {}

                            currentArr.push({
                              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                              date: dateStr,
                              text: input.value.trim()
                            });

                            setFormData({...formData, historial_comentarios: JSON.stringify(currentArr)});
                            input.value = '';
                          }}
                        >
                          + Agregar Comentario
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-foot">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="btn modal-btn-ghost">Cancelar</button>
                  <button onClick={handleSave} className="btn modal-btn-primary">Guardar Cambios</button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
                  <button onClick={handleDelete} className="btn" style={{ background: 'var(--danger, #dc3545)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
                    <Trash2 size={16} style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} />
                    Eliminar Expediente
                  </button>
                  <button onClick={() => setIsEditing(true)} className="btn modal-btn-primary">Editar Expediente</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Seguimiento ANP */}
      {selectedSeguimiento && (
        <div className="modal-overlay" onClick={() => setSelectedSeguimiento(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head accent-info">
              <div>
                <h3 className="modal-title">
                  <ClipboardList size={20} color="var(--info)" />
                  Seguimiento ANP <span className="pill">{selectedSeguimiento.internal_id || '—'}</span>
                </h3>
                <p className="modal-sub">{selectedSeguimiento.university || 'Universidad no asignada'}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  {isEditing ? (
                    <select className="form-control" style={{ width: 'auto', padding: '0.5rem 2.5rem 0.5rem 1.25rem', fontSize: '0.95rem', height: 'auto', fontWeight: 700, color: 'var(--text-main)', borderColor: 'var(--info)', borderRadius: '25px', backgroundColor: 'var(--bg-color)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }} value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="En trámite">En trámite</option>
                      <option value="Archivo">Archivo</option>
                      <option value="Derivado a UDRA">Derivado a UDRA</option>
                    </select>
                  ) : (
                    <span className={`badge ${
                      formData.status === 'Archivo' ? 'badge-status-archivo' : 
                      formData.status === 'Derivado a UDRA' ? 'badge-status-derivado' : 
                      formData.status === 'En trámite' ? 'badge-status-tramite' : 'badge-primary'
                    }`} style={{ fontSize: '0.95rem', padding: '0.5rem 1.25rem', borderRadius: '25px' }}>
                      {formData.status || 'Registrado'}
                    </span>
                  )}
                </div>
                <button className="modal-close" onClick={() => setSelectedSeguimiento(null)} title="Cerrar"><X size={20} /></button>
              </div>
            </div>

            <div className="modal-body">
              {/* Datos del expediente (solo lectura) */}
              <div className="modal-section">
                <div className="modal-section-title"><FileText size={15} /> Datos del expediente</div>
                <div className="field-grid">
                  {readOnlyField('Tipo ANP', formData.type_anp)}
                  {readOnlyField('Universidad', formData.university)}
                  {readOnlyField('Exp. Interno', formData.internal_id)}
                  {readOnlyField('Exp. SUNGED', formData.nro_expediente_sunged)}
                </div>
              </div>

              {/* Inicio ANP */}
              <div className="modal-section">
                <div className="modal-section-title"><FlagTriangleRight size={15} /> Inicio ANP</div>
                <div className="field-grid">
                  {labeled('Documento', 'inicio_anp_documento')}
                  {anpDateField('Fecha Notificación', 'inicio_anp')}
                  {anpDiasField('Días Hábiles', 'inicio_anp')}
                  {anpVencField('Fecha Vencimiento', 'inicio_anp')}
                  {labeled('Observaciones (Inicio ANP)', 'inicio_anp_observaciones', 'textarea', true)}
                  {labeled('Última Actuación', 'seg_anp_ultima_actuacion', 'text', true)}
                </div>
              </div>

              {/* Seguimiento ANP */}
              <div className="modal-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div 
                  className="modal-section-title" 
                  onClick={() => setShowSeguimientoPanel(!showSeguimientoPanel)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardList size={15} /> Seguimiento ANP
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-main)', background: 'var(--bg-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {showSeguimientoPanel ? 'Ocultar campos' : 'Ver campos'}
                  </span>
                </div>
                
                {showSeguimientoPanel && (
                  <div className="field-grid" style={{ marginTop: '1rem' }}>
                    {labeled('Documento', 'seg_anp_documento')}
                    {anpDateField('Fecha Notificación', 'seg_anp')}
                    {anpDiasField('Días Hábiles', 'seg_anp')}
                    {anpVencField('Fecha Vencimiento', 'seg_anp')}
                    {labeled('Observaciones', 'observations', 'textarea', true)}
                    {labeled('Estado Seguimiento', 'seg_anp_estado')}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-foot">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="btn modal-btn-ghost">Cancelar</button>
                  <button onClick={handleSave} className="btn modal-btn-primary">Guardar Cambios</button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="btn modal-btn-primary">Editar Seguimiento</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expedientes;
