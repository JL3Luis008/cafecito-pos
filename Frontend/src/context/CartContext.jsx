import { createContext, useContext, useState, useMemo } from 'react';
import Swal from 'sweetalert2';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [promocionSeleccionada, setPromocionSeleccionada] = useState(null);

  // Añadir producto al carrito

  const agregarItem = (producto) => {
    setItems((prev) => {
      const existe = prev.find((item) => item.productoId === producto._id);
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          Swal.fire('Stock Agotado', `Solo hay ${producto.stock} unidades de ${producto.nombre}`, 'warning');
          return prev;
        }
        // Incrementar cantidad
        return prev.map((item) =>
          item.productoId === producto._id
            ? { ...item, cantidad: item.cantidad + 1, stock: producto.stock }
            : item
        );
      }
      
      if (producto.stock <= 0) {
        Swal.fire('Agotado', 'Este producto no tiene stock disponible.', 'warning');
        return prev;
      }
      
      // Nuevo item
      return [
        ...prev,
        {
          productoId: producto._id,
          nombre: producto.nombre,
          precio: producto.precio,
          categoria: producto.categoria,
          cantidad: 1,
          stock: producto.stock,
        },
      ];
    });
  };

  // Restar o eliminar
  const restarItem = (productoId) => {
    setItems((prev) => {
      const existe = prev.find((item) => item.productoId === productoId);
      if (!existe) return prev;
      if (existe.cantidad === 1) {
        return prev.filter((item) => item.productoId !== productoId);
      }
      return prev.map((item) =>
        item.productoId === productoId
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      );
    });
  };

  const eliminarItem = (productoId) => {
    setItems((prev) => prev.filter((item) => item.productoId !== productoId));
  };

  // ... (otros métodos)


  const limpiarCarrito = () => {
    setItems([]);
    setCliente(null);
    setPromocionSeleccionada(null);
  };

  // Cálculos en tiempo real
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }, [items]);

  const discountPercent = useMemo(() => {
    if (!cliente) return 0;
    const compras = cliente.comprasRealizadas || 0;
    if (compras >= 1 && compras <= 3) return 5;
    if (compras >= 4 && compras <= 7) return 10;
    if (compras >= 8) return 15;
    return 0;
  }, [cliente]);

  const promoDiscountAmount = useMemo(() => {
    if (!promocionSeleccionada) return 0;
    if (promocionSeleccionada.tipo === 'porcentaje') {
      return (subtotal * (promocionSeleccionada.valor / 100));
    }
    return promocionSeleccionada.valor;
  }, [subtotal, promocionSeleccionada]);

  const discountAmount = useMemo(() => {
    return parseFloat(((subtotal * (discountPercent / 100)) + promoDiscountAmount).toFixed(2));
  }, [subtotal, discountPercent, promoDiscountAmount]);

  const total = useMemo(() => {
    return parseFloat((subtotal - discountAmount).toFixed(2));
  }, [subtotal, discountAmount]);

  const cantidadTotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.cantidad, 0);
  }, [items]);

  const value = {
    items,
    subtotal,
    discountPercent,
    discountAmount,
    promoDiscountAmount,
    promocionSeleccionada,
    setPromocionSeleccionada,
    total,
    cantidadTotal,
    cliente,
    setCliente,
    agregarItem,
    restarItem,
    eliminarItem,
    limpiarCarrito,
  };


  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
