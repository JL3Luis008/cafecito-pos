const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';

const CATEGORIA_ICONS = {
  bebidas:   '☕',
  alimentos: '🥪',
  postres:   '🍰',
  otros:     '📦',
};

/**
 * Card visual de producto para el catálogo del cajero.
 * @param {Object} producto
 * @param {Function} onAgregar — callback para Sprint 2 (carrito)
 */
export default function ProductoCard({ producto, onAgregar }) {
  const { nombre, precio, categoria, imagen, stock } = producto;
  const icon = CATEGORIA_ICONS[categoria] ?? '📦';

  return (
    <article className="producto-card animate-in">
      <div className="producto-card__img-wrap">
        {imagen ? (
          <img
            className="producto-card__img"
            src={`${SERVER_URL}${imagen}`}
            alt={nombre}
            loading="lazy"
          />
        ) : (
          <div className="producto-card__placeholder">{icon}</div>
        )}
      </div>

      <div className="producto-card__body">
        <span className={`badge badge-${categoria}`}>
          {icon} {categoria}
        </span>
        <p className="producto-card__nombre">{nombre}</p>
        <p className="producto-card__precio">
          ${Number(precio).toFixed(2)}
        </p>

        {typeof stock !== 'undefined' && (
          <p className={`text-xs mt-1 font-bold ${stock <= 5 ? 'text-danger' : 'text-muted'}`}>
            📦 Stock: {stock}
          </p>
        )}

        {/* Sprint 2: botón agregar al carrito */}
        {onAgregar && (
          <button
            className={`btn btn-sm w-full mt-2 ${stock <= 0 ? 'btn-danger opacity-50 cursor-not-allowed' : 'btn-primary'}`}
            onClick={() => onAgregar(producto)}
            disabled={stock <= 0}
          >
            {stock <= 0 ? 'Agotado' : '+ Agregar'}
          </button>
        )}
      </div>
    </article>
  );
}
