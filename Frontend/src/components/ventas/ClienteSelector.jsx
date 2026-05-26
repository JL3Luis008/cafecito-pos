import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ClienteSelector({ onSelectCliente }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [clienteActivo, setClienteActivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '', correo: '' });
  const [errorLocal, setErrorLocal] = useState('');

  useEffect(() => {
    if (busqueda.length < 2) {
      setResultados([]);
      return;
    }
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/clientes?busqueda=${busqueda}`);
        setResultados(res.data.data);
      } catch (error) {
        console.error('Error buscando clientes:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [busqueda]);

  const handleSelect = (cliente) => {
    setClienteActivo(cliente);
    setBusqueda('');
    setResultados([]);
    setMostrarForm(false);
    onSelectCliente(cliente);
  };

  const handleDesvincular = () => {
    setClienteActivo(null);
    onSelectCliente(null);
  };

  const handleCrearNuevo = async (e) => {
    e.preventDefault();
    setErrorLocal('');
    try {
      const { data } = await api.post('/clientes', nuevoCliente);
      handleSelect(data.data);
      setNuevoCliente({ nombre: '', telefono: '', correo: '' });
    } catch (error) {
      setErrorLocal(error.response?.data?.error || 'Error al registrar cliente. Probablemente el teléfono ya exista.');
    }
  };

  return (
    <div className="cliente-selector mb-3 border-b border-dashed border-gray-300 pb-3">
      {clienteActivo ? (
        <div className="flex justify-between items-center bg-mist p-2 rounded-md">
          <div>
            <p className="font-bold text-sm">Cliente vinculado:</p>
            <p className="text-sm">{clienteActivo.nombre}</p>
            <span className="badge badge-warning mt-1">
              🏆 {clienteActivo.comprasRealizadas || 0} compras (Nivel {clienteActivo.comprasRealizadas >= 8 ? 'VIP' : 'Fiel'})
            </span>
          </div>
          <button className="btn-remove" onClick={handleDesvincular} title="Desvincular cliente">✕</button>
        </div>
      ) : mostrarForm ? (
        <form onSubmit={handleCrearNuevo} className="bg-mist p-3 rounded-md animate-in">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm">Registrar Nuevo Cliente</h4>
            <button type="button" className="text-xs text-muted" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
          
          <div className="flex flex-col gap-2">
            <input 
              type="text" required placeholder="Nombre completo" 
              className="form-control text-sm py-1"
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
            />
            <input 
              type="tel" required placeholder="Teléfono" 
              className="form-control text-sm py-1"
              value={nuevoCliente.telefono}
              onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
            />
            <input 
              type="email" placeholder="Correo (opcional)" 
              className="form-control text-sm py-1"
              value={nuevoCliente.correo}
              onChange={(e) => setNuevoCliente({...nuevoCliente, correo: e.target.value})}
            />
            
            {errorLocal && <p className="text-xs text-danger">{errorLocal}</p>}
            
            <button type="submit" className="btn btn-primary btn-sm w-full">
              Registrar y Vincular
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2 items-start">
          <div className="search-box relative flex-1">
            <input
              type="text"
              className="form-control text-sm"
              placeholder="🔍 Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {loading && <span className="absolute right-2 top-2 text-xs text-gray-500">...</span>}
            
            {resultados.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {resultados.map((c) => (
                  <li 
                    key={c._id} 
                    className="p-2 hover:bg-mist cursor-pointer border-b last:border-0 text-sm"
                    onClick={() => handleSelect(c)}
                  >
                    <p className="font-bold">{c.nombre}</p>
                    <p className="text-xs text-gray-500">{c.telefono || 'Sin teléfono'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button 
            className="btn btn-dark btn-sm" 
            title="Nuevo Cliente"
            onClick={() => setMostrarForm(true)}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
