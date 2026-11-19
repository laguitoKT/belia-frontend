import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, Eye, EyeClosed } from 'lucide-react';
import { useAuth } from '../../../context/useAuth';
import { LoginResponseError } from '../services/authServices';
import logo from '../../../assets/LogoB2.png';
import ThemeToggle from '../../../components/ui/ThemeToggle';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login(formData.username, formData.password);
      navigate('/inicio');
    } catch (error) {
      setErrorMessage(
        error instanceof LoginResponseError
          ? error.message
          : error.response?.status === 401
            ? 'Correo o contraseña incorrectos, o cuenta inactiva.'
            : 'No se pudo iniciar sesión. Revisa la conexión con el servidor e inténtalo de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#F8F6F7]">
      <div className="absolute z-30 top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      {/* Fondo izquierdo con gradiente  */}
      <div className="relative w-full lg:w-[70%] lg:min-h-screen bg-gradient-to-br from-brand-primary via-[#9E1428] to-brand-accent flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 text-white overflow-hidden">
        
        {/* Círculos decorativos, hechos con CSS */}
        <div className="pointer-events-none absolute -top-24 right-12 w-[480px] h-[480px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-48 -left-24 w-[520px] h-[520px] rounded-full bg-brand-accent/25 blur-sm border border-white/5" />

        {/* Encabezado de Marca (Belia) */}
        <header className="relative z-10 flex items-center gap-4">
          {/* Logo de Belia */}
          <div className="brand-logo flex items-center justify-center w-16 h-16 p-1 bg-white rounded-md shadow-sm shrink-0">
            <img src={logo} alt="Belia" className="object-contain w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none tracking-tight text-white">
              Belia
            </h1>
            <p className="text-[10px] font-medium tracking-[0.22em] text-brand-light uppercase mt-1.5">
              GESTIONA TU SALÓN
            </p>
          </div>
        </header>

        {/* Mensaje Hero Central */}
        <div className="relative z-10 max-w-xl py-8 my-auto sm:py-12 lg:py-0">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-brand-soft mb-5">
            <span>GESTIÓN EN ARMONÍA</span>
          </div>

          <h2 className="text-3xl sm:text-5xl xl:text-[56px] font-bold tracking-tight leading-[1.08] text-white mb-6">
            Todo tu salón,
            <br />
            en un solo lugar.
          </h2>

          <p className="max-w-md text-base font-normal leading-relaxed sm:text-lg text-brand-soft/90">
            Organiza citas, clientes y servicios para que cada jornada fluya con
            naturalidad.
          </p>
        </div>

        {/* Espaciador inferior para mantener la proporción vertical */}
        <div className="hidden h-6 lg:block" />
      </div>

      {/* Contenedor de la Tarjeta de Inicio de Sesión  */}
      <div className="relative z-20 w-full lg:w-[40%] flex items-center justify-left p-6 sm:p-10 lg:p-0">
        <div className="w-full max-w-[440px] lg:-ml-44 xl:-ml-56 bg-white rounded-[32px] shadow-card border border-stone-100 px-8 sm:px-11 pt-10 pb-9 relative">
          
          {/* Detalle superior carmesí en el borde de la tarjeta */}
          <div className="absolute top-0 left-12 w-24 h-1.5 bg-gradient-to-r from-brand-primary to-brand-accent rounded-b-full" />

          {/* Encabezado del Formulario */}
          <div className="mb-8">
            <span className="block text-[11px] font-bold tracking-[0.16em] text-brand-primary uppercase mb-2.5">
              BIENVENIDA A BELIA
            </span>
            <h3 className="mb-2 text-3xl font-bold tracking-tight text-stone-900">
              Inicia sesión
            </h3>
            <p className="text-xs sm:text-sm text-stone-400">
              Ingresa tus datos para acceder al panel de gestión.
            </p>
          </div>

          {/* Mensaje de validación o error */}
          {errorMessage && (
            <div className="p-3 mb-5 text-xs font-medium border rounded-xl bg-brand-soft/60 border-brand-light text-brand-primary">
              {errorMessage}
            </div>
          )}

          {/* Formulario conectado al estado */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block mb-2 text-xs font-semibold text-stone-700"
              >
                Correo electrónico
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="email"
                value={formData.username}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-3.5 rounded-xl bg-surface-input border border-stone-200/80 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-xs font-semibold text-stone-700"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Escribe tu contraseña"
                  className="w-full px-4 py-3.5 pr-12 rounded-xl bg-surface-input border border-stone-200/80 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 flex items-center px-4 transition-colors text-stone-400 hover:text-brand-primary focus:outline-none focus:text-brand-primary"
                >
                  {showPassword ? (
                    <EyeClosed className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Opciones secundarias */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-stone-300 text-brand-primary focus:ring-brand-primary/30 accent-brand-primary"
                />
                <span className="text-xs font-medium text-stone-400">
                  Recordarme
                </span>
              </label>

              {/* Botón de recuperación de contraseña 
              <button
                type="button"
                className="text-xs font-semibold transition-colors text-brand-primary hover:text-brand-accent"
              >
                ¿Olvidaste tu contraseña?
              </button>
              */}

            </div>
            
            {/* Botón Principal con Gradiente */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-accent via-[#B81D35] to-brand-primary text-white font-semibold text-sm shadow-button hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-between group disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}</span>
                <ChevronRight className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>

          {/* Pie de tarjeta */}
          <div className="text-center mt-7">
            <p className="text-[11px] text-stone-400">
              Acceso exclusivo para el salón.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}