// src/pages/public/ProductsPage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';

// Tarjeta de producto con el nuevo estilo
const ProductCard = ({ product, addToCart }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 group">
    <div className="h-56 bg-gray-200 flex items-center justify-center overflow-hidden">
      <img 
        src={`https://placehold.co/400x400/e2e8f0/333333?text=${product.name}`}
        alt={`Imagen de ${product.name}`}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    </div>
    <div className="p-4">
      <h3 className="text-lg font-bold text-gray-800 truncate">{product.name}</h3>
      <p className="text-sm text-gray-600 mt-1 h-10">{product.category || 'Sin descripción.'}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-2xl font-bold text-koppel-blue">${parseFloat(product.price).toFixed(2)}</span>
        <button onClick={() => addToCart(product)} className="px-4 py-2 bg-koppel-blue text-white text-sm font-bold rounded-full hover:bg-blue-800 transition-transform transform hover:scale-105">
          Agregar
        </button>
      </div>
    </div>
  </div>
);


const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/products');
        setProducts(response.data);
      } catch (err) {
        setError('Debes iniciar sesión para ver los productos.');
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
        <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-koppel-blue mx-auto"></div>
            <p className="mt-4">Cargando productos...</p>
        </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold mb-2 text-gray-800">Bienvenido, {user?.username || 'invitado'}!</h1>
      <p className="text-lg text-gray-600 mb-8">Descubre nuestras increíbles ofertas.</p>

      {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}
      
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <ProductCard key={product.id} product={product} addToCart={addToCart}/>
          ))}
        </div>
      ) : (
        !error && <p className="text-center">No hay productos disponibles en este momento.</p>
      )}
    </div>
  );
};

export default ProductsPage;
