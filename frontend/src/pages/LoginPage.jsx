// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

// Un simple logo de Koppel
const KoppelLogo = () => (
    <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-koppel-blue">
            Koppel
            <span className="text-koppel-yellow">.</span>
        </h1>
        <p className="text-gray-500">Tu tienda de confianza</p>
    </div>
);


const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      login(response.data.token);
      navigate('/products'); // Redirigir a productos después del login
    } catch (err) {
      setError('Credenciales inválidas. Inténtalo de nuevo.');
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <KoppelLogo />
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-koppel-blue focus:border-koppel-blue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-koppel-blue focus:border-koppel-blue"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full px-4 py-3 font-bold text-white bg-koppel-blue rounded-md hover:bg-blue-800 transition-transform transform hover:scale-105">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
