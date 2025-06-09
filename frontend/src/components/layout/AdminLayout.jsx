// src/components/layout/AdminLayout.jsx

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to;
    return (
        <Link 
            to={to} 
            className={`flex items-center px-4 py-2.5 rounded-md transition-colors ${
                isActive ? 'bg-koppel-blue text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
        >
            {children}
        </Link>
    );
  };


  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-800 text-white flex flex-col">
        <div className="h-20 flex items-center justify-center text-2xl font-bold bg-koppel-blue">
          Admin Panel
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavLink to="/admin/sales">Ventas</NavLink>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <NavLink to="/admin/reports">Reportes</NavLink>
          )}
          <NavLink to="/products">Ver Tienda</NavLink>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
