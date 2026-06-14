import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getPromocionesVigentes } from '../api/promociones';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [promocionManual, setPromocionManual] = useState(null);
  const [promosVigentes, setPromosVigentes] = useState([]);

  // Cargar promociones al iniciar o periódicamente
  const fetchPromos = async () => {
    try {
      const { data } = await getPromocionesVigentes();
      setPromosVigentes(data);
    } catch (err) {
      console.error("Context: Error cargando promos", err);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  // Añadir producto al carrito
  const agregarItem = (producto) => {
    setItems((prev) => {
      const existe = prev.find((item) => item.productoId === producto._id);
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          Swal.fire('Stock Agotado', `Solo hay ${producto.stock} unidades.`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.productoId === producto._id ? { ...item, cantidad: item.cantidad + 1, stock: producto.stock } : item
        );
      }
      if (producto.stock <= 0) {
        Swal.fire('Agotado', 'Sin stock.', 'warning');
        return prev;
      }
      return [...prev, {
        productoId: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        categoria: producto.categoria,
        cantidad: 1,
        stock: producto.stock,
      }];
    });
  };

  const restarItem = (productoId) => {
    setItems((prev) => {
      const existe = prev.find((item) => item.productoId === productoId);
      if (!existe) return prev;
      if (existe.cantidad === 1) return prev.filter((item) => item.productoId !== productoId);
      return prev.map((item) => item.productoId === productoId ? { ...item, cantidad: item.cantidad - 1 } : item);
    });
  };

  const eliminarItem = (productoId) => setItems((prev) => prev.filter((item) => item.productoId !== productoId));
  const limpiarCarrito = () => {
    setItems([]);
    setCliente(null);
    setPromocionManual(null);
  };

  // Cálculos en tiempo real
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.precio * item.cantidad, 0), [items]);

  // BUSCAR MEJOR PROMO AUTOMÁTICA
  const promocionAutomatica = useMemo(() => {
    const validas = promosVigentes.filter(p => {
      if (p.aplicacion !== 'automatica') return false;
      if (p.criterio === 'general') return true;
      if (p.criterio === 'cliente_frecuente' && cliente) {
        const compras = cliente.comprasRealizadas || 0;
        const cumpleMin = compras >= (p.minimoCompras || 0);
        const cumpleMax = !p.maximoCompras || p.maximoCompras === 0 || compras <= p.maximoCompras;
        return cumpleMin && cumpleMax;
      }
      return false;
    });

    if (validas.length === 0) return null;
    return validas.sort((a, b) => b.valor - a.valor)[0];
  }, [promosVigentes, cliente]);


  // La promo aplicada es la Manual si existe, si no la Automática
  const promocionAplicada = promocionManual || promocionAutomatica;

  const promoDiscountAmount = useMemo(() => {
    if (!promocionAplicada) return 0;
    if (promocionAplicada.tipo === 'porcentaje') {
      return (subtotal * (promocionAplicada.valor / 100));
    }
    return promocionAplicada.valor;
  }, [subtotal, promocionAplicada]);

  // Mantenemos fidelidad legacy por ahora si no hay promo aplicada, 
  // o lo quitamos si ya se configuraron las nuevas promos. 
  // Por petición del usuario, usaremos el nuevo modelo de promos para fidelidad.
  const loyaltyPercent = useMemo(() => {
    // Si ya hay una promo aplicada (manual o auto), no aplicamos fidelity legacy
    if (promocionAplicada) return 0;
    
    if (!cliente) return 0;
    const compras = cliente.comprasRealizadas || 0;
    if (compras >= 1 && compras <= 3) return 5;
    if (compras >= 4 && compras <= 7) return 10;
    if (compras >= 8) return 15;
    return 0;
  }, [cliente, promocionAplicada]);

  const discountAmount = useMemo(() => {
    return parseFloat(((subtotal * (loyaltyPercent / 100)) + promoDiscountAmount).toFixed(2));
  }, [subtotal, loyaltyPercent, promoDiscountAmount]);

  const total = useMemo(() => parseFloat((subtotal - discountAmount).toFixed(2)), [subtotal, discountAmount]);
  const cantidadTotal = useMemo(() => items.reduce((acc, item) => acc + item.cantidad, 0), [items]);

  const value = {
    items, subtotal, discountAmount, promoDiscountAmount, 
    promocionSeleccionada: promocionManual, setPromocionSeleccionada: setPromocionManual,
    promocionAplicada, 
    total, cantidadTotal, cliente, setCliente,
    agregarItem, restarItem, eliminarItem, limpiarCarrito,
    promosVigentes, fetchPromos
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
