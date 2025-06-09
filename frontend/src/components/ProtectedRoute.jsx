import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdminOrManager } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdminOrManager) {
    // Redirigir si no tiene el rol adecuado
    return <Navigate to="/admin/sales" replace />; // O a una página de "Acceso Denegado"
  }

  return children;
};

export default ProtectedRoute;