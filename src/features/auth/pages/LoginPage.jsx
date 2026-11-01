import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // TODO: Cuando el endpoint de FastAPI esté listo, se reemplazará por:
      // const response = await authService.login(formData.username, formData.password);
      
      // Simulación temporal para navegar al módulo de Inicio:
      if (formData.username.trim() && formData.password.trim()) {
        localStorage.setItem('belia_access_token', 'mock-jwt-token');
        navigate('/inicio');
      } else {
        setErrorMessage('Por favor ingresa tu usuario y contraseña.');
      }
    } catch (error) {
      setErrorMessage('Credenciales incorrectas. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#F8F6F7]">
      {/* Fondo izquierdo con gradiente (~70% en pantallas grandes) */}
      <div className="relative w-full lg:w-[70%] min-h-[420px] lg:min-h-screen bg-gradient-to-br from-brand-primary via-[#9E1428] to-brand-accent flex flex-col justify-between p-8 sm:p-12 lg:p-16 xl:p-20 text-white overflow-hidden">
        
        {/* Círculos decorativos sutiles del mockup */}
        <div className="pointer-events-none absolute -top-24 right-12 w-[480px] h-[480px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-48 -left-24 w-[520px] h-[520px] rounded-full bg-brand-accent/25 blur-sm border border-white/5" />

        {/* Encabezado de Marca (Belia) */}
        <header className="relative z-10 flex items-center gap-4">
          <div className="w-11 h-11 bg-white rounded-sm shrink-0 shadow-sm" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">
              Belia
            </h1>
            <p className="text-[10px] font-medium tracking-[0.22em] text-brand-light uppercase mt-1.5">
              GESTIONA TU SALÓN
            </p>
          </div>
        </header>

        {/* Mensaje Hero Central */}
        <div className="relative z-10 my-auto max-w-xl py-12 lg:py-0">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-brand-soft mb-5">
            <Sparkles className="w-4 h-4 text-brand-light" />
            <span>GESTIÓN EN ARMONÍA</span>
          </div>

          <h2 className="text-4xl sm:text-5xl xl:text-[56px] font-bold tracking-tight leading-[1.08] text-white mb-6">
            Todo tu salón,
            <br />
            en un solo lugar.
          </h2>

          <p className="text-base sm:text-lg text-brand-soft/90 font-normal leading-relaxed max-w-md">
            Organiza citas, clientes y servicios para que cada jornada fluya con
            naturalidad.
          </p>
        </div>

        {/* Espaciador inferior para mantener la proporción vertical del mockup */}
        <div className="hidden lg:block h-6" />
      </div>

      {/* Contenedor de la Tarjeta de Inicio de Sesión (Superpuesta en la división) */}
      <div className="relative z-20 w-full lg:w-[30%] flex items-center justify-center p-6 sm:p-10 lg:p-0">
        <div className="w-full max-w-[440px] lg:-ml-44 xl:-ml-56 bg-white rounded-[32px] shadow-card border border-stone-100 px-8 sm:px-11 pt-10 pb-9 relative">
          
          {/* Detalle superior carmesí en el borde de la tarjeta */}
          <div className="absolute top-0 left-12 w-24 h-1.5 bg-gradient-to-r from-brand-primary to-brand-accent rounded-b-full" />

          {/* Encabezado del Formulario */}
          <div className="mb-8">
            <span className="block text-[11px] font-bold tracking-[0.16em] text-brand-primary uppercase mb-2.5">
              BIENVENIDA A AURORA
            </span>
            <h3 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">
              Inicia sesión
            </h3>
            <p className="text-xs sm:text-sm text-stone-400">
              Ingresa tus datos para acceder al panel de gestión.
            </p>
          </div>

          {/* Mensaje de validación o error */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-brand-soft/60 border border-brand-light text-brand-primary text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Formulario conectado al estado */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-stone-700 mb-2"
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Escribe tu usuario"
                className="w-full px-4 py-3.5 rounded-xl bg-surface-input border border-stone-200/80 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-stone-700 mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Escribe tu contraseña"
                className="w-full px-4 py-3.5 rounded-xl bg-surface-input border border-stone-200/80 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
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
                <span className="text-xs text-stone-400 font-medium">
                  Recordarme
                </span>
              </label>

              <button
                type="button"
                className="text-xs font-semibold text-brand-primary hover:text-brand-accent transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
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
          <div className="mt-7 text-center">
            <p className="text-[11px] text-stone-400">
              Acceso exclusivo para el equipo de Aurora.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}