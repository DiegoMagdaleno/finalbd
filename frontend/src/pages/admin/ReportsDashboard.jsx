import React, { useState } from 'react';
import apiClient from '../../api/axiosConfig';

const ReportsDashboard = () => {
  // Aquí iría la lógica para generar reportes
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async (event) => {
    event.preventDefault();
    // Lógica para obtener storeIds, startDate y endDate del formulario
    // Ejemplo hardcodeado:
    const params = {
      storeIds: '1,2',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    };

    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/reports/sales', { params });
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo generar el reporte.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Reportes de Ventas</h1>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <form onSubmit={handleGenerateReport} className="mb-4">
          {/* Aquí agregarías inputs para fechas y IDs de tiendas */}
          <button type="submit" disabled={isLoading} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </button>
        </form>

        {error && <p className="text-red-500">{error}</p>}

        {reportData && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Resultados del Reporte</h2>
            <pre className="p-4 mt-2 text-sm bg-gray-100 rounded">{JSON.stringify(reportData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;