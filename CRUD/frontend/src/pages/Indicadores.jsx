import React, { useEffect, useState } from 'react';
import { Search, Target, ChevronLeft, ChevronRight, Search as SearchIcon, X } from 'lucide-react';
import { API_URL } from '../config';

const Indicadores = () => {
  const [indicadores, setIndicadores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [filterModelo, setFilterModelo] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/catalogs/indicadores`)
      .then(res => res.json())
      .then(data => setIndicadores(data))
      .catch(err => console.error(err));
  }, []);

  // Deduplicate on frontend so we only see one row per Modelo+NroIndicador
  const uniqueIndicadores = [];
  const seen = new Set();
  for (const i of indicadores) {
    const key = `${i.Modelo}_${i.NroIndicador}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueIndicadores.push(i);
    }
  }

  // Sort logically
  const sortedUnique = uniqueIndicadores.sort((a, b) => {
    // 1. Sort by Modelo (MLI, MSPAD, MLUN)
    const modeloOrder = { "MLI": 1, "MSPAD": 2, "MLUN": 3 };
    const orderA = modeloOrder[a.Modelo] || 99;
    const orderB = modeloOrder[b.Modelo] || 99;
    if (orderA !== orderB) return orderA - orderB;

    // 2. Sort by NroIndicador
    let numA = parseInt(a.NroIndicador) || 0;
    let numB = parseInt(b.NroIndicador) || 0;
    if (numA === 0) numA = 9999;
    if (numB === 0) numB = 9999;
    return numA - numB;
  });

  const normalizeStr = (str) => {
    return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const filtered = sortedUnique.filter(i => {
    const s = normalizeStr(searchTerm);
    const matchesSearch = normalizeStr(i.DenomCBC).includes(s) || 
                          normalizeStr(i.Componente).includes(s) || 
                          normalizeStr(i.DenomIndicador).includes(s);
    const matchesModelo = filterModelo === "" || i.Modelo === filterModelo;
    return matchesSearch && matchesModelo;
  });

  // Get unique Modelos for the filter dropdown
  const uniqueModelos = [...new Set(indicadores.map(i => i.Modelo))]
    .filter(Boolean)
    .sort((a, b) => {
      const order = { "MLI": 1, "MSPAD": 2, "MLUN": 3 };
      return (order[a] || 99) - (order[b] || 99);
    });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  // Reset page when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Get MVs for the selected indicator
  const selectedMVs = selectedIndicator 
    ? indicadores.filter(i => i.Modelo === selectedIndicator.Modelo && i.NroIndicador === selectedIndicator.NroIndicador)
    : [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--success)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
          <Target size={24} />
        </div>
        <h2>Base de Datos: Modelos / Indicadores</h2>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', flex: 1, minWidth: '300px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por Condición (CBC), Componente o Indicador..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select 
              className="form-control" 
              style={{ width: 'auto', padding: '0.35rem 2rem 0.35rem 0.75rem', fontSize: '0.8125rem' }} 
              value={filterModelo} 
              onChange={e => setFilterModelo(e.target.value)}
            >
              <option value="">Todos los Modelos</option>
              {uniqueModelos.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Mostrar:</span>
            <select 
              className="form-control" 
              style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.5rem', margin: 0 }}
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
                <th style={{ width: '8%' }}>Modelo</th>
                <th style={{ width: '8%' }}>CBC</th>
                <th style={{ width: '25%' }}>Denom. CBC</th>
                <th style={{ width: '15%' }}>Componente</th>
                <th style={{ width: '10%' }}>Indicador</th>
                <th style={{ width: '28%' }}>Denominación del Indicador</th>
                <th style={{ width: '6%', textAlign: 'center' }}>MVs</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron indicadores</td>
                </tr>
              ) : (
                paginated.map(i => (
                  <tr key={`${i.Modelo}_${i.NroIndicador}`}>
                    <td><span className="badge badge-info">{i.Modelo}</span></td>
                    <td><span className="badge badge-success">{i.CBC}</span></td>
                    <td><div className="line-clamp-3">{i.DenomCBC}</div></td>
                    <td><div className="line-clamp-3">{i.Componente}</div></td>
                    <td><span className="badge badge-warning">{i.NroIndicador}</span></td>
                    <td><div className="line-clamp-3">{i.DenomIndicador}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => setSelectedIndicator(i)}
                        className="btn" 
                        style={{ padding: '0.35rem', background: 'var(--bg-color)', color: 'var(--primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        title="Ver Medios de Verificación"
                      >
                        <SearchIcon size={16} />
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
            Mostrando {Math.min(startIndex + 1, filtered.length)} a {Math.min(startIndex + pageSize, filtered.length)} de {filtered.length} registros
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

      {/* Modal for MVs */}
      {selectedIndicator && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
            width: '90%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Medios de Verificación</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Modelo: <strong style={{ color: 'var(--primary)' }}>{selectedIndicator.Modelo}</strong> | Indicador: <strong style={{ color: 'var(--warning)' }}>{selectedIndicator.NroIndicador}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedIndicator(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                    <th style={{ width: '20%', padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>MV (Código)</th>
                    <th style={{ width: '80%', padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>Medio de Verificación (Denominación)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMVs.map(mv => (
                    <tr key={mv.IdIndicador}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                        <span className="badge badge-warning">{mv.MV}</span>
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div className="line-clamp-3">{mv.MedioVerificacion}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Indicadores;
