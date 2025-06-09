import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout'; // Ahora la importación funcionará
import PublicLayout from './components/layout/PublicLayout'; // Y esta también

// Páginas
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/public/ProductsPage';
import SalesDashboard from './pages/admin/SalesDashboard';
import ReportsDashboard from './pages/admin/ReportsDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PublicLayout><ProductsPage /></PublicLayout>} />

          {/* Rutas de Administración Protegidas */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="sales" element={<SalesDashboard />} />
                    <Route
                      path="reports"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <ReportsDashboard />
                        </ProtectedRoute>
                      }
                    />
                    {/* Redirección por defecto dentro del panel de admin */}
                    <Route path="*" element={<Navigate to="sales" replace />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Redirección para cualquier otra ruta no encontrada */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;