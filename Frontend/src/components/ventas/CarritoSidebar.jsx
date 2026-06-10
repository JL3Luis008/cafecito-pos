import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { useState } from 'react';
import ClienteSelector from './ClienteSelector';
import TicketModal from './TicketModal';

/**
 * Componente visual del carrito de compras lateral.
 */
export default function CarritoSidebar() {
  const { 
    items, subtotal, discountPercent, discountAmount, total, 
    agregarItem, restarItem, eliminarItem, limpiarCarrito,
    cliente, setCliente 
  } = useCart();
  
  const [procesando, setProcesando] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [showTicket, setShowTicket] = useState(false);

  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [cambio, setCambio] = useState(0);

  const handleEfectivoChange = (valor) => {
    setEfectivoRecibido(valor);
    const recibido = parseFloat(valor) || 0;
    if (recibido >= total) {
      setCambio(recibido - total);
    } else {
      setCambio(0);
    }
  };

  const handleConfirmar = async () => {
    if (items.length === 0) return;
    
    // Validación de pago insuficiente
    if (metodoPago === 'efectivo' && (parseFloat(efectivoRecibido) || 0) < total) {
      return Swal.fire('Atención', 'Monto recibido insuficiente para cubrir el total', 'warning');
    }

    setProcesando(true);
    try {
      const payload = {
        items: items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
        })),
        clienteId: cliente ? cliente._id : null,
        metodoPago,
        efectivoRecibido: parseFloat(efectivoRecibido) || 0,
        cambio: cambio
      };

      const { data } = await api.post('/ventas', payload);
      
      setVentaExitosa(data.data);
      setShowTicket(true);
      // Limpiar estados locales de pago para la siguiente venta
      setMetodoPago('efectivo');
      setEfectivoRecibido('');
      setCambio(0);

    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'No se pudo registrar la venta', 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarTicket = () => {
    setShowTicket(false);
    setVentaExitosa(null);
    limpiarCarrito();
  };

  if (items.length === 0) {
    return (
      <div className="carrito-sidebar empty">
        <span className="carrito-icon-empty">🛒</span>
        <p>El carrito está vacío</p>
        <p className="text-small text-muted">Selecciona productos del catálogo para comenzar</p>
      </div>
    );
  }

  return (
    <>
      <div className="carrito-sidebar">
        <div className="carrito-header">
          <h2>Resumen de Venta</h2>
          <button className="btn btn-outline btn-sm text-danger" onClick={limpiarCarrito}>
            Vaciar
          </button>
        </div>

        <div className="carrito-items-container">
          <ClienteSelector onSelectCliente={setCliente} />
          
          {items.map((item) => (
            <div key={item.productoId} className="carrito-item">
            <div className="carrito-item-info">
              <span className="carrito-item-name">{item.nombre}</span>
              <span className="carrito-item-price">${Number(item.precio).toFixed(2)} c/u</span>
            </div>

            <div className="carrito-item-actions">
              <button className="btn-qty" onClick={() => restarItem(item.productoId)}>-</button>
              <span className="carrito-item-qty">{item.cantidad}</span>
              <button 
                className={`btn-qty ${item.cantidad >= item.stock ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => agregarItem({ _id: item.productoId, stock: item.stock, nombre: item.nombre })}
                disabled={item.cantidad >= item.stock}
                title={item.cantidad >= item.stock ? 'Stock máximo' : 'Añadir 1'}
              >
                +
              </button>
              
              <div className="carrito-item-subtotal">
                ${(item.precio * item.cantidad).toFixed(2)}
              </div>
              <button className="btn-remove" onClick={() => eliminarItem(item.productoId)} title="Quitar">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="carrito-footer">
        <div className="carrito-resumen-precios">
          <div className="carrito-resumen-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          
          {discountPercent > 0 && (
            <div className="carrito-resumen-row text-success">
              <span>Descuento Fidelidad ({discountPercent}%)</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="carrito-total-row">
            <span>Total a cobrar</span>
            <span className="carrito-total-amount">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* --- Sección de Pago --- */}
        <div className="payment-section mt-4 pt-4 border-t border-gray-200">
          <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Método de Pago</label>
          <div className="payment-methods-grid">
            <button 
              className={`btn-payment ${metodoPago === 'efectivo' ? 'active' : ''}`}
              onClick={() => setMetodoPago('efectivo')}
            >
              💵 Efectivo
            </button>
            <button 
              className={`btn-payment ${metodoPago === 'tarjeta' ? 'active' : ''}`}
              onClick={() => setMetodoPago('tarjeta')}
            >
              💳 Tarjeta
            </button>
            <button 
              className={`btn-payment ${metodoPago === 'transferencia' ? 'active' : ''}`}
              onClick={() => setMetodoPago('transferencia')}
            >
              🏦 Transf.
            </button>
          </div>

          {metodoPago === 'efectivo' && (
            <div className="cash-handling mt-3 animate-in">
              <div className="form-group">
                <label className="text-xs font-bold text-gray-700">Monto Recibido</label>
                <div className="flex gap-2 items-center">
                   <span className="text-lg font-bold text-gray-400">$</span>
                   <input 
                    type="number" 
                    className="form-control text-lg font-bold" 
                    placeholder="0.00"
                    value={efectivoRecibido}
                    onChange={(e) => handleEfectivoChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 p-2 bg-blue-50 rounded-lg">
                <span className="text-sm font-bold text-blue-700">Cambio:</span>
                <span className="text-xl font-black text-blue-800">${cambio.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        
          <button 
            className="btn btn-success btn-lg w-full mt-4" 
            onClick={handleConfirmar}
            disabled={procesando}
          >
            {procesando ? 'Procesando...' : `Finalizar Venta`}
          </button>
        </div>
      </div>

      <TicketModal 
        isOpen={showTicket} 
        onClose={handleCerrarTicket} 
        venta={ventaExitosa} 
      />
    </>
  );
}
