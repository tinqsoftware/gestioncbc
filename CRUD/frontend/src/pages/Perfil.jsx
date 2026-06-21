import React, { useState } from 'react';
import { API_URL } from '../config';

const Perfil = ({ user, onPasswordChanged }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    fetch(`${API_URL}/users/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, oldPassword, newPassword })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setSuccess('Contraseña actualizada correctamente.');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          if (onPasswordChanged) onPasswordChanged();
        }
      })
      .catch(err => {
        setError('Error al conectar con el servidor');
      });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mi Perfil</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Datos Personales</h3>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Nombre</span>
            <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.25rem' }}>{user.name}</div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Correo Electrónico</span>
            <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.25rem' }}>{user.email}</div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rol en el Sistema</span>
            <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.25rem' }}>{user.role}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Cambiar Contraseña</h3>
          
          {error && <div className="alert error" style={{ marginBottom: '1rem' }}>{error}</div>}
          {success && <div className="alert success" style={{ marginBottom: '1rem', background: '#d1fae5', color: '#065f46', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #34d399' }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña Actual</label>
              <input 
                type="password" 
                className="form-control" 
                value={oldPassword} 
                onChange={e => setOldPassword(e.target.value)} 
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nueva Contraseña</label>
              <input 
                type="password" 
                className="form-control" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required
              />
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Confirmar Nueva Contraseña</label>
              <input 
                type="password" 
                className="form-control" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
