import {
  X,
  Phone,
  Mail,
  Sparkles,
  Clock,
  History,
  Pencil,
  User,
  Power,
} from 'lucide-react';
import { formatEmployeeServiceDate } from '../services/employeesService';
import { getCategoryTheme } from '../../../components/ui/categoryThemes';
import { getInitialsTheme } from '../../../components/ui/initialsThemes';

export default function EmployeeDetailModal({
  employee,
  isOpen,
  onClose,
  onEdit,
  onToggleActive,
  onOpenFullHistory,
}) {
  if (!isOpen || !employee) return null;

  const recentThreeServices = (employee.serviceHistory || []).slice(0, 3);
  const isActive = employee.active !== false;
  const employeeTheme = getCategoryTheme(employee.specialtyCategory);
  const initialsTheme = getInitialsTheme(employee.id || employee.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="responsive-dialog relative w-full max-w-3xl bg-white rounded-[30px] shadow-card border border-stone-100 p-7 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors top-5 right-5 w-9 h-9 rounded-xl bg-surface-bg text-stone-400 hover:text-brand-primary"
          aria-label="Cerrar información del empleado"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-4 pr-8 mt-2 mb-6">
          <div className={`w-16 h-16 rounded-full ${initialsTheme.background} border-4 border-white flex items-center justify-center ${initialsTheme.text} font-bold text-lg shrink-0`}>
            {employee.initials}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-[0.14em] text-brand-primary uppercase">
                PERFIL DE ESPECIALISTA
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActive
                    ? 'bg-[#E8F6F0] text-[#1E7E5A]'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">
              {employee.name}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Especialidad: {employee.specialtyCategory}
            </p>
          </div>
        </div>

        {/* Datos de Contacto, Especialidad y Horario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface-bg p-4 rounded-2xl border border-stone-100 text-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-brand-soft/50 w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Especialidad
              </p>
              <p className={`font-bold ${employeeTheme.text}`}>
                {employee.specialty}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-brand-soft/50 w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Horario
              </p>
              <p className="font-bold text-stone-800">
                {employee.scheduleFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-brand-soft/50 w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">Teléfono</p>
              <p className="font-bold text-stone-800">{employee.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-brand-soft/50 w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400">
                Correo electrónico
              </p>
              <p className="font-bold truncate text-stone-800">
                {employee.email}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de los últimos 3 servicios realizados por el especialista */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-[0.14em] text-brand-primary uppercase">
              ÚLTIMOS SERVICIOS REALIZADOS
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullHistory(employee);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-accent transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>
                Ver historial completo
              </span>
            </button>
          </div>

          {recentThreeServices.length === 0 ? (
            <div className="p-4 text-xs text-center border rounded-2xl bg-surface-bg border-stone-100 text-stone-400">
              Este especialista aún no cuenta con servicios registrados en su historial.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentThreeServices.map((srv) => {
                const theme = getCategoryTheme(srv.category);
                return (
                <div
                  key={srv.id}
                  className="p-3.5 rounded-2xl bg-[#FAF7F8] border border-stone-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">
                        {srv.service}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${theme.bg} ${theme.text}`}>
                        {srv.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-400 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-brand-primary" />
                        {formatEmployeeServiceDate(srv)}
                        {srv.endTime ? ` - ${srv.endTime} hrs` : ' hrs'}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Cliente: {srv.client}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-sm font-bold text-stone-900">
                      ${srv.price}
                    </span>
                    <span className="inline-block text-[10px] font-semibold text-emerald-600">
                      {srv.status}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Acciones del perfil */}
        <div className="flex flex-wrap items-end gap-2 pt-4 mt-6 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleActive(employee);
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isActive ? 'Desactivar' : 'Activar'}</span>
            </button>

            {/*
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullHistory(employee);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-surface-bg hover:bg-brand-soft/50 text-brand-primary text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <History className="w-4 h-4" />
              <span>Historial</span>
            </button>            
            */}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#FADCE6] text-brand-primary text-xs font-bold inline-flex items-center gap-1.5 hover:bg-brand-light/60"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-accent"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}