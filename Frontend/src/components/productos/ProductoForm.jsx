import { useState, useEffect, useRef } from 'react';

const CATEGORIAS = ['bebidas', 'alimentos', 'postres', 'otros'];
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';

const INIT_FORM = { nombre: '', precio: '', categoria: '', stock: 0, imagen: null };

/**
 * Formulario controlado para crear/editar productos.
 * @param {Object|null} producto — null = modo crear
 * @param {Function} onSubmit — recibe FormData
 * @param {boolean} loading
 * @param {string|null} serverError
 */
export default function ProductoForm({ producto, onSubmit, loading = false, serverError = null, formRef = null }) {
  const [form, setForm]       = useState(INIT_FORM);
  const [errors, setErrors]   = useState({});
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  // Cargar datos al editar
  useEffect(() => {
    if (producto) {
      setForm({
        nombre:   producto.nombre,
        precio:   producto.precio,
        categoria: producto.categoria,
        stock:    producto.stock ?? 0,
        imagen:   null,
      });
      setPreview(producto.imagen ? `${SERVER_URL}${producto.imagen}` : null);
      setErrors({});
    } else {
      setForm(INIT_FORM);
      setPreview(null);
      setErrors({});
    }
  }, [producto]);

  // ── Validación en cliente ────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.nombre.trim())          e.nombre    = 'El nombre es obligatorio';
    else if (form.nombre.length > 100) e.nombre   = 'Máximo 100 caracteres';
    if (!form.precio)                  e.precio   = 'El precio es obligatorio';
    else if (Number(form.precio) <= 0) e.precio   = 'Debe ser mayor a 0';
    if (!form.categoria)               e.categoria = 'Selecciona una categoría';
    if (form.stock === '' || Number(form.stock) < 0) e.stock = 'Stock inválido';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX = 5 * 1024 * 1024;
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED.includes(file.type)) {
      setErrors((prev) => ({ ...prev, imagen: 'Solo JPG, PNG, WebP o GIF' }));
      return;
    }
    if (file.size > MAX) {
      setErrors((prev) => ({ ...prev, imagen: 'La imagen no puede superar 5 MB' }));
      return;
    }

    setForm((prev) => ({ ...prev, imagen: file }));
    setErrors((prev) => ({ ...prev, imagen: '' }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const data = new FormData();
    data.append('nombre',    form.nombre.trim());
    data.append('precio',    form.precio);
    data.append('categoria', form.categoria);
    data.append('stock',     form.stock);
    if (form.imagen) data.append('imagen', form.imagen);

    onSubmit(data);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {/* Error del servidor */}
      {serverError && (
        <div className="alert alert-danger" role="alert">⚠️ {serverError}</div>
      )}

      {/* Nombre */}
      <div className="form-group mb-4">
        <label className="form-label" htmlFor="nombre">
          Nombre <span className="required">*</span>
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          className={`form-control${errors.nombre ? ' error' : ''}`}
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej. Café Americano"
          maxLength={100}
          autoComplete="off"
        />
        {errors.nombre && <span className="form-error">⚠️ {errors.nombre}</span>}
      </div>

      {/* Precio y Categoría */}
      <div className="form-grid form-grid-2 mb-4">
        <div className="form-group">
          <label className="form-label" htmlFor="precio">
            Precio (MXN) <span className="required">*</span>
          </label>
          <input
            id="precio"
            name="precio"
            type="number"
            step="0.01"
            min="0.01"
            className={`form-control${errors.precio ? ' error' : ''}`}
            value={form.precio}
            onChange={handleChange}
            placeholder="0.00"
          />
          {errors.precio && <span className="form-error">⚠️ {errors.precio}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="categoria">
            Categoría <span className="required">*</span>
          </label>
          <select
            id="categoria"
            name="categoria"
            className={`form-control${errors.categoria ? ' error' : ''}`}
            value={form.categoria}
            onChange={handleChange}
          >
            <option value="">Seleccionar…</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          {errors.categoria && <span className="form-error">⚠️ {errors.categoria}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="stock">
            Stock <span className="required">*</span>
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            className={`form-control${errors.stock ? ' error' : ''}`}
            value={form.stock}
            onChange={handleChange}
            placeholder="0"
          />
          {errors.stock && <span className="form-error">⚠️ {errors.stock}</span>}
        </div>
      </div>

      {/* Imagen */}
      <div className="form-group">
        <label className="form-label">Imagen del producto</label>
        <div
          className="file-input-wrap"
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFile}
            aria-label="Seleccionar imagen"
          />
          {preview ? (
            <img className="img-preview" src={preview} alt="Vista previa" />
          ) : (
            <>
              <div style={{ fontSize: '2rem' }}>🖼️</div>
              <p className="text-muted mt-1">
                Haz clic para seleccionar una imagen
              </p>
              <p className="text-small" style={{ color: 'var(--c-text-light)' }}>
                JPG, PNG, WebP — máx. 5 MB
              </p>
            </>
          )}
        </div>
        {errors.imagen && <span className="form-error">⚠️ {errors.imagen}</span>}
        {preview && (
          <button
            type="button"
            className="btn btn-outline btn-sm mt-1"
            onClick={() => {
              setPreview(null);
              setForm((prev) => ({ ...prev, imagen: null }));
              if (fileRef.current) fileRef.current.value = '';
            }}
          >
            ✕ Quitar imagen
          </button>
        )}
      </div>
    </form>
  );
}
