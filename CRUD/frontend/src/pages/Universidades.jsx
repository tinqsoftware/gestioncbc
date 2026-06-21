import React, { useEffect, useState } from 'react';
import { Search, Building, ChevronLeft, ChevronRight, Search as SearchIcon, X } from 'lucide-react';
import { API_URL } from '../config';

const Universidades = () => {
  const [universidades, setUniversidades] = useState([]);
  const [locales, setLocales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUniversity, setSelectedUniversity] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/catalogs/universidades`)
      .then(res => res.json())
      .then(data => setUniversidades(data))
      .catch(err => console.error(err));
      
    fetch(`${API_URL}/catalogs/locales`)
      .then(res => res.json())
      .then(data => setLocales(data))
      .catch(err => console.error(err));
  }, []);

  const normalizeStr = (str) => {
    return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const filtered = universidades
    .filter(u => {
      const s = normalizeStr(searchTerm);
      return normalizeStr(u.Nombre).includes(s) || normalizeStr(u.Siglas).includes(s);
    })
    .sort((a, b) => {
      if (!a.Nombre) return 1;
      if (!b.Nombre) return -1;
      return a.Nombre.localeCompare(b.Nombre);
    });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  // Reset page when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const getLocalesForUniversity = (id) => {
    return locales.filter(l => l.IdUniversidad === id);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
          <Building size={24} />
        </div>
        <h2>Base de Datos: Universidades</h2>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por Nombre o Siglas..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
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
                <th style={{ width: '25%' }}>Nombre</th>
                <th style={{ width: '7%' }}>Siglas</th>
                <th style={{ width: '8%' }}>Gestión</th>
                <th style={{ width: '11%' }}>Departamento</th>
                <th style={{ width: '11%' }}>Provincia</th>
                <th style={{ width: '11%' }}>Distrito</th>
                <th style={{ width: '21%' }}>Dirección</th>
                <th style={{ width: '6%', textAlign: 'center' }}>Locales</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron universidades</td>
                </tr>
              ) : (
                paginated.map(u => (
                  <tr key={u.IdUniversidad}>
                    <td style={{ fontWeight: 500 }}><div className="line-clamp-3">{u.Nombre}</div></td>
                    <td><span className="badge badge-info">{u.Siglas}</span></td>
                    <td><div className="line-clamp-3">{u.TipoGestion}</div></td>
                    <td><div className="line-clamp-3">{u.Departamento}</div></td>
                    <td><div className="line-clamp-3">{u.Provincia}</div></td>
                    <td><div className="line-clamp-3">{u.Distrito}</div></td>
                    <td><div className="line-clamp-3">{u.Direccion}</div></td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => setSelectedUniversity(u)}
                        className="btn" 
                        style={{ padding: '0.35rem', background: 'var(--bg-color)', color: 'var(--primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                        title="Ver Locales"
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

      {/* Modal for Locales */}
      {selectedUniversity && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
            width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Locales Registrados</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Universidad: <strong style={{ color: 'var(--primary)' }}>{selectedUniversity.Nombre}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedUniversity(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                    <th style={{ width: '10%', padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>Código</th>
                    <th style={{ width: '10%', padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>Sede Princ.</th>
                    <th style={{ width: '15%', padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>Departamento</th>
                    <th style={{ width: '15%', padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>Provincia</th>
                    <th style={{ width: '15%', padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>Distrito</th>
                    <th style={{ width: '35%', padding: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>Dirección</th>
                  </tr>
                </thead>
                <tbody>
                  {getLocalesForUniversity(selectedUniversity.IdUniversidad).length > 0 ? (
                    getLocalesForUniversity(selectedUniversity.IdUniversidad).map(local => (
                      <tr key={local.IdLocal}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                          <span className="badge badge-warning">{local.CodigoLocal}</span>
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>{local.SedePrincipal === 1 ? 'Sí' : 'No'}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}><div className="line-clamp-3">{local.Departamento}</div></td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}><div className="line-clamp-3">{local.Provincia}</div></td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}><div className="line-clamp-3">{local.Distrito}</div></td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}><div className="line-clamp-3">{local.Direccion}</div></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay locales registrados para esta universidad</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Universidades;
