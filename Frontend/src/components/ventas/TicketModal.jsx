import Modal from '../ui/Modal';

export default function TicketModal({ isOpen, onClose, venta }) {
  if (!venta) return null;

  const { folio, items, total, createdAt } = venta;
  const fecha = new Date(createdAt).toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recibo de Venta">
      <div className="ticket-container" id="printable-ticket">
        <div className="ticket-header text-center mb-4">
          <h2 className="ticket-logo">☕ Cafecito Feliz</h2>
          <p className="text-muted text-small">{fecha}</p>
          <p className="font-bold mt-1">Folio: {folio}</p>
        </div>

        <div className="ticket-body">
          <table className="w-full text-small">
            <thead>
              <tr style={{ borderBottom: '1px dashed #ccc' }}>
                <th className="text-left py-1">Cant.</th>
                <th className="text-left py-1">Artículo</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="py-1">{item.cantidad}</td>
                  <td className="py-1">{item.nombre}</td>
                  <td className="text-right py-1">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ticket-footer mt-4" style={{ borderTop: '1px dashed #ccc', paddingTop: '0.5rem' }}>
          <div className="flex justify-between text-small">
            <span>Subtotal:</span>
            <span>${venta.subtotal?.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-small text-gray-600 italic">
            <span>IVA (16% incl.):</span>
            <span>${venta.impuestos?.toFixed(2)}</span>
          </div>
          
          {venta.descuentoMonto > 0 && (
            <div className="flex flex-col text-small font-bold" style={{ color: '#059669' }}>
               {venta.descuentoPorcentaje > 0 && (
                 <div className="flex justify-between">
                   <span>Fidelidad ({venta.descuentoPorcentaje}%):</span>
                   <span>-${((venta.subtotal * (venta.descuentoPorcentaje/100))).toFixed(2)}</span>
                 </div>
               )}
               {venta.promocion && (
                 <div className="flex justify-between">
                   <span>Promo: {venta.promocion.nombre}:</span>
                   <span>-${(venta.descuentoMonto - (venta.subtotal * (venta.descuentoPorcentaje/100))).toFixed(2)}</span>
                 </div>
               )}
            </div>
          )}


          <div className="flex justify-between font-bold text-lg mt-1" style={{ borderTop: '2px dashed #000', paddingTop: '0.25rem' }}>
            <span>TOTAL:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="payment-details mt-4 p-2 bg-gray-50 rounded border border-gray-200">
             <div className="flex justify-between text-xs font-bold uppercase">
                <span>Método Pago:</span>
                <span>{venta.metodoPago}</span>
             </div>
             {venta.metodoPago === 'efectivo' && (
               <>
                 <div className="flex justify-between text-small mt-1">
                    <span>Efectivo Recibido:</span>
                    <span>${venta.efectivoRecibido?.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-small font-bold text-blue-700">
                    <span>Cambio:</span>
                    <span>${venta.cambio?.toFixed(2)}</span>
                 </div>
               </>
             )}
          </div>

          <p className="text-center mt-4 font-bold">¡Gracias por su compra!</p>
        </div>
      </div>

      <div className="modal-footer no-print">
        <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
        <button className="btn btn-primary" onClick={handlePrint}>🖨️ Imprimir</button>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-ticket, #printable-ticket * { visibility: visible; }
          #printable-ticket {
            position: absolute;
            left: 0; top: 0; width: 100%;
            margin: 0; padding: 20px;
            font-family: monospace;
          }
          .no-print { display: none; }
          .modal-overlay { background: transparent; }
          .modal-box { box-shadow: none; border: none; }
        }
        .ticket-container {
          font-family: 'Courier New', Courier, monospace;
          padding: 1rem;
          background: #fff;
          color: #000;
          border: 1px solid #ccc;
          margin-bottom: 1rem;
        }
        .ticket-logo { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.25rem; }
      `}</style>
    </Modal>
  );
}
