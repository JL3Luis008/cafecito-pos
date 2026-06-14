import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import ClienteSelector from './ClienteSelector';
import TicketModal from './TicketModal';

export default function CarritoSidebar() {
  const { 
    items, subtotal, discountAmount, total, 
    promoDiscountAmount, promocionSeleccionada, setPromocionSeleccionada,
    promocionAplicada, promosVigentes,
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
    setCambio(recibido >= total ? recibido - total : 0);
  };

  const handleConfirmar = async () => {
    if (items.length === 0) return;
    if (metodoPago === 'efectivo' && (parseFloat(efectivoRecibido) || 0) < total) {
      return Swal.fire('Atención', 'Monto insuficiente', 'warning');
    }

    setProcesando(true);
    try {
      const payload = {
        items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
        clienteId: cliente ? cliente._id : null,
        promocionId: promocionAplicada ? promocionAplicada._id : null,
        metodoPago,
        efectivoRecibido: parseFloat(efectivoRecibido) || 0,
        cambio: cambio
      };
      const { data } = await api.post('/ventas', payload);
      setVentaExitosa(data.data);
      setShowTicket(true);
      setMetodoPago('efectivo');
      setEfectivoRecibido('');
      setCambio(0);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'Error en venta', 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarTicket = () => {
    setShowTicket(false);
    limpiarCarrito();
  };

  if (items.length === 0) {
    return (
      <div className="carrito-sidebar empty">
        <span className="carrito-icon-empty">🛒</span>
        <p>El carrito está vacío</p>
      </div>
    );
  }

  // Filtrar solo las manuales para el selector
  const promosManualesDisponibles = promosVigentes.filter(p => p.aplicacion === 'manual');

  return (
    <>
      <div className="carrito-sidebar">
        <div className="carrito-header">
          <h2>Resumen de Venta</h2>
          <button className="btn btn-outline btn-sm text-danger" onClick={limpiarCarrito}>Vaciar</button>
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
                <button className="btn-qty" onClick={() => agregarItem({ _id: item.productoId, stock: item.stock, nombre: item.nombre, precio: item.precio })}> + </button>
                <div className="carrito-item-subtotal">${(item.precio * item.cantidad).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="carrito-footer">
          {/* Selector de Promociones Manuales */}
          <div className="promo-selector mb-4">
            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Promoción Manual</label>
            <select 
              className="form-control text-sm font-bold"
              value={promocionSeleccionada?._id || ''}
              onChange={(e) => {
                const selected = promosManualesDisponibles.find(p => p._id === e.target.value);
                setPromocionSeleccionada(selected || null);
              }}
            >
              <option value="">Ninguna manual seleccionada</option>
              {promosManualesDisponibles.map(p => (
                <option key={p._id} value={p._id}>{p.nombre} (-{p.tipo === 'porcentaje' ? `${p.valor}%` : `$${p.valor}`})</option>
              ))}
            </select>
          </div>

          <div className="carrito-resumen-precios">
            <div className="carrito-resumen-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {promocionAplicada && (
               <div className={`carrito-resumen-row text-small font-bold ${promocionAplicada.aplicacion === 'automatica' ? 'text-green-600' : 'text-caramel'}`}>
                <span>
                  {promocionAplicada.aplicacion === 'automatica' ? '✨ Promo Auto: ' : '🎁 Promo: '} 
                  {promocionAplicada.nombre}
                </span>
                <span>-${promoDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="carrito-total-row">
              <span>Total a cobrar</span>
              <span className="carrito-total-amount">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-section mt-4 pt-4 border-t border-gray-200">
            <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Método de Pago</label>
            <div className="payment-methods-grid">
              {['efectivo', 'tarjeta', 'transferencia'].map(m => (
                <button key={m} className={`btn-payment ${metodoPago === m ? 'active' : ''}`} onClick={() => setMetodoPago(m)}>
                  {m === 'efectivo' ? '💵' : m === 'tarjeta' ? '💳' : '🏦'} {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {metodoPago === 'efectivo' && (
              <div className="cash-handling mt-3 animate-in">
                <input type="number" className="form-control text-lg font-bold" placeholder="Efectivo Recibido" value={efectivoRecibido} onChange={(e) => handleEfectivoChange(e.target.value)} />
                <div className="flex justify-between items-center mt-2 p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm font-bold text-blue-700">Cambio:</span>
                  <span className="text-xl font-black text-blue-800">${cambio.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          
          <button className="btn btn-success btn-lg w-full mt-4" onClick={handleConfirmar} disabled={procesando}>
            {procesando ? 'Procesando...' : `Finalizar Venta`}
          </button>
        </div>
      </div>

      <TicketModal isOpen={showTicket} onClose={handleCerrarTicket} venta={ventaExitosa} />
    </>
  );
}
