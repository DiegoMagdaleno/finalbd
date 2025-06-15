import React from 'react';
import Swal from 'sweetalert2';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../hooks/useAuth';

const Cart = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
    clearCart
  } = useCart();
  
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'Debes iniciar sesión para comprar',
        confirmButtonColor: '#2563eb'
     });
      return;
    }
    try {
      await apiClient.post('/sales', {
        userId: user.id,
        storeId: user.storeId,
        items: cart.map(item => ({
          productId: item.id,
          quantity: Number(item.quantity),
          price: Number(item.amount ?? 0)
        }))
      });
      
      clearCart();
      setIsCartOpen(false);
      window.dispatchEvent(new Event('sale:created'));
      Swal.fire({
        icon: 'success',
        title: '¡Compra realizada con éxito!',
        showConfirmButton: false,
        timer: 1800
      });

    } catch (error) {
      console.error('Error al realizar la compra:', error);
      Swal.fire({
        icon: 'error',
        title: 'Hubo un error al procesar tu compra',
        text: error.response?.data?.error || '',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={() => setIsCartOpen(false)}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Tu Carrito</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mt-4">
              {cart.length === 0 ? (
                <p className="text-gray-500">Tu carrito está vacío</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">${Number(item.amount ?? 0)} c/u</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="w-20 text-right">
                        ${(Number(item.amount ?? 0) * Number(item.quantity ?? 0)).toFixed(2)}
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 px-3 py-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {cart.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <div className="w-full flex justify-between items-center">
                <span className="font-bold">Total: ${(totalPrice).toFixed(2)}</span>
                <button
                  onClick={handleCheckout}
                  className="px-4 py-2 bg-koppel-blue text-white font-bold rounded hover:bg-blue-700"
                >
                  Finalizar Compra
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;