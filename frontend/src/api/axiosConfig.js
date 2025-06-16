import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // ¡Cambiado! Nginx se encargará de redirigir esto.
});

// Interceptor para agregar el token a las cabeceras
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // Asumiendo que tu middleware `auth` espera "Bearer"
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;