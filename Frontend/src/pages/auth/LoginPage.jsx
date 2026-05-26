import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire('Error', 'Por favor ingresa correo y contraseña', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      Swal.fire('Error de Acceso', error.displayMessage || 'Credenciales inválidas', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'var(--c-bg-light)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--c-caramel)', margin: 0 }}>☕ Cafecito POS</h1>
          <p className="text-muted mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group mb-4">
            <label className="form-label">Correo Electrónico</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cafecito.com"
              required
            />
          </div>

          <div className="form-group mb-6">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
