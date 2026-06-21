import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, KeyRound, X } from 'lucide-react';
import { API_URL } from '../config';

const Usuarios = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', email: '', password: '', role: 'Registrador' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Protect route
  if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Administrador') {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>No tienes permisos para ver este módulo.</div>;
  }

  const fetchUsers = () => {
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showMessage = (msg, type = 'success') => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };

  const openModal = (user = null) => {
    if (user) {
      setFormData({ ...user, password: '' }); // Don't show password on edit
    } else {
      setFormData({ id: null, name: '', email: '', password: '', role: 'Registrador' });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = formData.id ? `${API_URL}/users/${formData.id}` : `${API_URL}/users`;
    const method = formData.id ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          showMessage(data.message);
          setIsModalOpen(false);
          fetchUsers();
        }
      })
      .catch(err => setError('Error de conexión'));
  };

  const handleDelete = (id) => {
    if (id === currentUser.id) {
      showMessage('No puedes eliminar tu propia cuenta', 'error');
      return;
    }
    if (window.confirm('¿Estás seguro de eliminar este usuario permanentemente?')) {
      fetch(`${API_URL}/users/${id}`, { method: 'DELETE' })
        .then(() => {
          showMessage('Usuario eliminado');
          fetchUsers();
        })
        .catch(() => showMessage('Error al eliminar', 'error'));
    }
  };

  const handleResetPassword = (id) => {
    if (window.confirm('¿Estás seguro de resetear la contraseña de este usuario a "12345678"? Se le pedirá que la cambie al ingresar.')) {
      fetch(`${API_URL}/users/${id}/reset-password`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.error) showMessage(data.error, 'error');
          else showMessage(data.message);
        })
        .catch(() => showMessage('Error al resetear', 'error'));
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Gestión de Usuarios</h1>
        <button onClick={() => openModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      {success && <div className="alert success" style={{ marginBottom: '1rem', background: '#d1fae5', color: '#065f46', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #34d399' }}>{success}</div>}
      {error && <div className="alert error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo Electrónico</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'Admin' || u.role === 'Administrador' ? 'badge-status-tramite' : 'badge-primary'}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  {u.must_change_password ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 'bold' }}>Debe cambiar pass</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Activo</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={() => handleResetPassword(u.id)} className="btn" style={{ padding: '0.35rem', color: 'var(--warning)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', borderRadius: '4px' }} title="Resetear a 12345678">
                      <KeyRound size={16} />
                    </button>
                    <button onClick={() => openModal(u)} className="btn" style={{ padding: '0.35rem', color: 'var(--primary)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', borderRadius: '4px' }} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="btn" style={{ padding: '0.35rem', color: 'var(--danger)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', borderRadius: '4px' }} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-head">
              <h3 className="modal-title">{formData.id ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert error" style={{ marginBottom: '1rem' }}>{error}</div>}
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nombre Completo</label>
                  <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo Electrónico</label>
                  <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>

                {!formData.id && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña Temporal</label>
                    <input type="text" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="Será forzado a cambiarla" />
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Rol</label>
                  <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="Administrador">Administrador</option>
                    <option value="Registrador">Registrador</option>
                    <option value="Visualizador">Visualizador</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-foot">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn modal-btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
