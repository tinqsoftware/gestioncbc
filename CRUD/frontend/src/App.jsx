import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Expedientes from './pages/Expedientes';
import ExpedienteForm from './pages/ExpedienteForm';
import Universidades from './pages/Universidades';
import Indicadores from './pages/Indicadores';
import Reportes from './pages/Reportes';
import Feriados from './pages/Feriados';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';
import ForcePasswordChange from './pages/ForcePasswordChange';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('anp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData, password = '') => {
    localStorage.setItem('anp_user', JSON.stringify(userData));
    if (password) {
      sessionStorage.setItem('temp_password', password);
    }
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('anp_user');
    sessionStorage.removeItem('temp_password');
    setUser(null);
  };

  const handlePasswordChanged = () => {
    const updatedUser = { ...user, must_change_password: 0 };
    handleLogin(updatedUser);
    sessionStorage.removeItem('temp_password');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (Number(user.must_change_password) === 1) {
    return <ForcePasswordChange user={user} onPasswordChanged={handlePasswordChanged} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expedientes" element={<Expedientes />} />
          <Route path="/expedientes/nuevo" element={<ExpedienteForm />} />
          <Route path="/universidades" element={<Universidades />} />
          <Route path="/indicadores" element={<Indicadores />} />
          <Route path="/feriados" element={<Feriados />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/usuarios" element={<Usuarios currentUser={user} />} />
          <Route path="/perfil" element={<Perfil user={user} onPasswordChanged={handleLogout} />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
