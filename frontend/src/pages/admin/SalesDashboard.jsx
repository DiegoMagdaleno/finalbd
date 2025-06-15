import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { useAuth } from '../../hooks/useAuth';

const SalesDashboard = () => {
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth(); // Obtener información del usuario logueado

  useEffect(() => {
    const fetchRecentSales = async () => {
      if (!user) return; // No hacer nada si el usuario aún no está cargado

      try {
        const response = await apiClient.get('/sales?limit=20');
        setRecentSales(response.data);
      } catch (err) {
        setError('No se pudieron cargar las ventas recientes.');
        console.error('Error fetching sales:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSales();
    
    const handleSaleCreated = () => {
      setLoading(true);
      fetchRecentSales();
    };
    window.addEventListener('sale:created', handleSaleCreated);


    return () => window.removeEventListener('sale:created', handleSaleCreated);
  }, [user]); // El efecto se ejecuta cuando 'user' esté disponible

  if (loading) {
    return <p>Cargando ventas...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ventas Recientes (Tienda: {user?.storeId})</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-5 py-3">ID Venta</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Items</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.length > 0 ? (
              recentSales.map(sale => (
                <tr key={sale.id} className="border-b border-gray-200">
                  <td className="px-5 py-4 text-sm">{sale.id}</td>
                  <td className="px-5 py-4 text-sm">{new Date(sale.timestamp).toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm font-semibold">${parseFloat(sale.amount).toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm">{sale.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-10">No hay ventas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesDashboard;