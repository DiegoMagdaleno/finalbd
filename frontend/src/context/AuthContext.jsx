import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Opcional: Verificar si el token ha expirado
        if (decodedToken.exp * 1000 > Date.now()) {
          setUser({
            userId: decodedToken.userId,
            storeId: decodedToken.storeId,
            role: decodedToken.role,
          });
        } else {
          // Token expirado
          logout();
        }
      } catch (error) {
        console.error("Invalid token:", error);
        logout();
      }
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const authContextValue = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    isAdminOrManager: user?.role === 'admin' || user?.role === 'manager',
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};