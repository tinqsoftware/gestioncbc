import React, { useState } from 'react';
import { API_URL } from '../config';

const ForcePasswordChange = ({ user, onPasswordChanged }) => {
  const [oldPassword, setOldPassword] = useState(sessionStorage.getItem('temp_password') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
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
          setSuccess('Contraseña actualizada correctamente. Redirigiendo...');
          setTimeout(() => {
            onPasswordChanged();
          }, 1500);
        }
      })
      .catch(err => {
        setError('Error al conectar con el servidor');
      });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Cambio de Contraseña Requerido</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Por seguridad, debes establecer una nueva contraseña antes de continuar.
          </p>
        </div>

        {error && <div className="alert error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert success" style={{ marginBottom: '1rem', background: '#d1fae5', color: '#065f46', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #34d399' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña Temporal o Actual</label>
            <input 
              type="password" 
              className="form-control" 
              value={oldPassword} 
              onChange={e => setOldPassword(e.target.value)} 
              required
              placeholder="La contraseña con la que ingresaste"
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
              placeholder="Min. 6 caracteres"
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
              placeholder="Min. 6 caracteres"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Guardar y Continuar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
