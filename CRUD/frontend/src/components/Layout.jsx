import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Download, Settings, User, Building, Target, LogOut, CalendarOff } from 'lucide-react';

const Layout = ({ children, user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="app-container">
      <aside 
        className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="sidebar-brand">
          ANP 2026
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/expedientes" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FileText size={20} />
            <span>Expedientes</span>
          </NavLink>
          <NavLink to="/universidades" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Building size={20} />
            <span>Universidades</span>
          </NavLink>
          <NavLink to="/indicadores" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Target size={20} />
            <span>Modelos / Indicadores</span>
          </NavLink>
          <NavLink to="/feriados" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <CalendarOff size={20} />
            <span>Feriados</span>
          </NavLink>
          <NavLink to="/reportes" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Download size={20} />
            <span>Descargar Reporte</span>
          </NavLink>
          <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-color)' }}></div>
          <NavLink to="/perfil" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <User size={20} />
            <span>Mi Perfil</span>
          </NavLink>
          {(user?.role === 'Admin' || user?.role === 'Administrador') && (
            <>
              <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                {!isCollapsed && 'Configuración'}
              </div>
              <NavLink to="/usuarios" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
                <Settings size={20} />
                <span>Usuarios</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>
      
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h2>Sistema de Gestión de Expedientes</h2>
          </div>
          <div className="header-user" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name || 'Usuario'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role || 'Invitado'}</span>
            </div>
            <button onClick={onLogout} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--danger)', padding: '0.35rem 0.75rem' }}>
              <LogOut size={16} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Salir</span>
            </button>
          </div>
        </header>
        
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
