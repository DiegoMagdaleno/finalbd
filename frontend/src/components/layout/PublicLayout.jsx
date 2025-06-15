// src/components/layout/PublicLayout.jsx

import React from 'react';
import Cart from '../Cart';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const PublicLayout = ({ children }) => {
    const { isAuthenticated, logout } = useAuth();
    const { totalItems, setIsCartOpen } = useCart();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-koppel-blue shadow-lg sticky top-0 z-10">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <Link to="/products" className="text-3xl font-extrabold text-white">
                        Koppel
                        <span className="text-koppel-yellow">.</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        {isAuthenticated && (
                            <Link to="/admin/sales" className="text-sm font-medium text-white hover:text-koppel-yellow">
                                Panel Admin
                            </Link>
                        )}
                        <button 
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 text-white hover:text-koppel-yellow"
                        >
                            <ShoppingCartIcon className="h-6 w-6" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-koppel-yellow text-koppel-blue text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={isAuthenticated ? handleLogout : () => navigate('/login')}
                            className="px-5 py-2 font-bold text-koppel-blue bg-koppel-yellow rounded-full hover:bg-yellow-400 transition-transform transform hover:scale-105"
                        >
                            {isAuthenticated ? 'Cerrar Sesión' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </nav>
            </header>
            <main className="container mx-auto px-6 py-8">
                {children}
            </main>
            <footer className="bg-white mt-8 py-6">
                <div className="container mx-auto px-6 text-center text-gray-600">
                    &copy; {new Date().getFullYear()} Koppel. Proyecto Universitario.
                </div>
            </footer>
            <Cart />
        </div>
    );
};

export default PublicLayout;

