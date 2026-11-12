import { useState, useEffect } from 'react';
import { X, ShieldQuestion, Check } from 'lucide-react';

const SPECIALTY_OPTIONS = [
  { label: 'Estilista senior', category: 'Cabello' },
  { label: 'Colorista', category: 'Coloración' },
  { label: 'Manicurista', category: 'Uñas' },
  { label: 'Especialista en mirada', category: 'Mirada' },
  { label: 'Maquillista profesional', category: 'Maquillaje' },
  { label: 'Especialista facial', category: 'Facial' },
];

const WEEK_DAYS = [
  { id: 'Lun', label: 'Lunes' },
  { id: 'Mar', label: 'Martes' },
  { id: 'Mié', label: 'Miércoles' },
  { id: 'Jue', label: 'Jueves' },
  { id: 'Vie', label: 'Viernes' },
  { id: 'Sáb', label: 'Sábado' },
  { id: 'Dom', label: 'Domingo' },
];

const formatDaysToString = (selectedIds = []) => {
  const ordered = WEEK_DAYS.map((d) => d.id).filter((id) =>
    selectedIds.includes(id)
  );
  if (ordered.length === 0) return '';
  if (ordered.length === 1) return ordered[0];

  const indices = ordered.map((id) => WEEK_DAYS.findIndex((d) => d.id === id));
  const isConsecutive = indices.every(
    (val, i, arr) => i === 0 || val === arr[i - 1] + 1
  );

  if (isConsecutive && ordered.length >= 3) {
    return `${ordered[0]}–${ordered[ordered.length - 1]}`;
  }
  return ordered.join(', ');
};

// Convierte 'Lun–Vie' o 'Lun, Mié' de vuelta a arreglo si no existía workDaysList
const parseDaysFromRecord = (emp) => {
  if (Array.isArray(emp?.workDaysList) && emp.workDaysList.length > 0) {
    return emp.workDaysList;
  }
  const str = emp?.workDays || '';
  if (str.includes('–')) {
    const [start, end] = str.split('–').map((s) => s.trim());
    const sIdx = WEEK_DAYS.findIndex((d) => d.id === start);
    const eIdx = WEEK_DAYS.findIndex((d) => d.id === end);
    if (sIdx !== -1 && eIdx !== -1 && eIdx >= sIdx) {
      return WEEK_DAYS.slice(sIdx, eIdx + 1).map((d) => d.id);
    }
  }
  return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
};

export default function EmployeeFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  existingEmployees = [],
}) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    specialty: 'Estilista senior',
    workDaysList: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    workDays: 'Lun–Vie',
    startTime: '09:00',
    endTime: '18:00',
    active: true,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        password: '',
        specialty: initialData.specialty || 'Estilista senior',
        workDaysList: parseDaysFromRecord(initialData),
        workDays: initialData.workDays || 'Lun–Vie',
        startTime: initialData.startTime || '09:00',
        endTime: initialData.endTime || '18:00',
        active: initialData.active !== false,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        password: '',
        specialty: 'Estilista senior',
        workDaysList: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
        workDays: 'Lun–Vie',
        startTime: '09:00',
        endTime: '18:00',
        active: true,
      });
    }
    setFieldErrors({});
    setShowSaveConfirm(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

const toggleWorkDay = (dayId) => {
    setFormData((prev) => {
      const exists = prev.workDaysList.includes(dayId);
      const nextDays = exists
        ? prev.workDaysList.filter((id) => id !== dayId)
        : [...prev.workDaysList, dayId];
      return { ...prev, workDaysList: nextDays };
    });
    if (fieldErrors.workDays) {
      setFieldErrors((prev) => ({ ...prev, workDays: undefined }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const digitsOnly = formData.phone.replace(/\D/g, '');

    if (!trimmedName || trimmedName.length < 3) {
      errors.name = 'Ingresa el nombre completo (mínimo 3 caracteres).';
    } else {
      const isDuplicate = existingEmployees.some(
        (emp) =>
          emp.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          emp.id !== initialData?.id
      );
      if (isDuplicate) {
        errors.name = 'Ya existe un empleado registrado con este nombre.';
      }
    }

    if (digitsOnly.length < 10) {
      errors.phone = 'Ingresa un teléfono válido de al menos 10 dígitos.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      errors.email = 'Ingresa un correo electrónico válido.';
    } else {
      const emailDup = existingEmployees.some(
        (emp) =>
          emp.email.trim().toLowerCase() === trimmedEmail.toLowerCase() &&
          emp.id !== initialData?.id
      );
      if (emailDup) {
        errors.email = 'Este correo ya está asignado a otro empleado.';
      }
    }
    if ((!isEditing || formData.password) && formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (new TextEncoder().encode(formData.password).length > 72) {
      errors.password = 'La contraseña no puede superar 72 bytes en UTF-8.';
    }
    if (!formData.workDaysList || formData.workDaysList.length === 0) {
      errors.workDays = 'Selecciona al menos un día laboral de la semana.';
    }

    if (!formData.startTime || !formData.endTime) {
      errors.schedule = 'Selecciona la hora de entrada y de salida.';
    } else if (formData.endTime <= formData.startTime) {
      errors.schedule = 'La hora de salida debe ser posterior a la entrada.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowSaveConfirm(true);
    }
  };

  const handleConfirmSave = () => {
    const matchedSpecialty =
      SPECIALTY_OPTIONS.find((s) => s.label === formData.specialty) ||
      SPECIALTY_OPTIONS[0];
    
    const orderedDays = WEEK_DAYS.map((d) => d.id).filter((id) =>
      formData.workDaysList.includes(id)
    );

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      ...((!isEditing || formData.password) && { password: formData.password }),
      specialty: matchedSpecialty.label,
      specialtyCategory: matchedSpecialty.category,
      workDaysList: orderedDays,
      workDays: formatDaysToString(orderedDays),
      startTime: formData.startTime,
      endTime: formData.endTime,
      active: Boolean(formData.active),
    };

    setShowSaveConfirm(false);
    onSave(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/35 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[650px] bg-white rounded-[32px] shadow-card border border-stone-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors bg-white border top-8 right-8 w-11 h-11 rounded-2xl border-stone-200/80 text-stone-600 hover:text-brand-primary"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-12 mb-6">
          <span className="block text-xs font-bold tracking-[0.14em] text-brand-primary uppercase mb-1.5">
            {isEditing ? 'EDITAR ESPECIALISTA' : 'NUEVO REGISTRO'}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-stone-900">
            {isEditing ? 'Editar empleado' : 'Agregar empleado'}
          </h3>
          <p className="mt-1 text-sm text-stone-400">
            Completa los datos de contacto, especialidad y horario laboral.
          </p>
        </div>

        <form onSubmit={handleRequestSubmit} className="space-y-4" noValidate>
          {/* Fila 1: Nombre y Especialidad */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Nombre completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Mariana Silva"
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none ${
                  fieldErrors.name
                    ? 'border-red-400'
                    : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Especialidad
              </label>
              <select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border border-stone-200/90 text-sm text-stone-800 focus:outline-none focus:border-brand-primary cursor-pointer"
              >
                {SPECIALTY_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label} ({opt.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: Teléfono y Correo electrónico */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ej. 55 1298 7781"
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none ${
                  fieldErrors.phone
                    ? 'border-red-400'
                    : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {fieldErrors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej. mariana@aurora.mx"
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none ${
                  fieldErrors.email
                    ? 'border-red-400'
                    : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-xs font-bold text-stone-800">
              {isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              placeholder={isEditing ? 'Déjala vacía para no cambiarla' : 'Al menos 8 caracteres'}
              className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none ${
                fieldErrors.password
                  ? 'border-red-400'
                  : 'border-stone-200/90 focus:border-brand-primary'
              }`}
            />
            {fieldErrors.password && (
              <p className="text-[11px] font-medium text-red-600 mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

        {/* Selector de días de la semana */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-stone-800">
                Días laborales (Selecciona los días que trabaja)
              </label>
              <span className="text-[11px] font-semibold text-brand-primary">
                {formatDaysToString(formData.workDaysList) || 'Ninguno seleccionado'}
              </span>
            </div>
            <div
              className={`p-3 rounded-2xl bg-[#FAFAFB] border flex flex-wrap gap-1 ${
                fieldErrors.workDays ? 'border-red-400' : 'border-stone-200/90'
              }`}
            >
              {WEEK_DAYS.map((day) => {
                const isSelected = formData.workDaysList.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleWorkDay(day.id)}
                    className={`flex-1 min-w-[74px] py-2.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-brand-primary text-white border-brand-primary shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-brand-light'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>{day.id}</span>
                  </button>
                );
              })}
            </div>
            {fieldErrors.workDays && (
              <p className="text-[11px] font-medium text-red-600 mt-1">
                {fieldErrors.workDays}
              </p>
            )}
          </div>

          {/* Fila de Horas: Entrada y Salida */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Hora de entrada
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border border-stone-200/90 text-sm text-stone-800 focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Hora de salida
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border border-stone-200/90 text-sm text-stone-800 focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          {fieldErrors.schedule && (
            <p className="text-[11px] font-medium text-red-600 -mt-2">
              {fieldErrors.schedule}
            </p>
          )}
          
          {showSaveConfirm ? (
            <div className="p-4 rounded-2xl bg-[#FDF2F5] border border-brand-light/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-brand-primary text-xs font-bold">
                <ShieldQuestion className="w-5 h-5 shrink-0" />
                <span>
                  ¿Estás seguro de que deseas guardar los datos de este empleado?
                </span>
              </div>
              <div className="flex items-center self-end gap-2 sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowSaveConfirm(false)}
                  className="px-4 py-2 text-xs font-bold bg-white border rounded-xl border-stone-200 text-stone-700"
                >
                  Revisar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-brand-primary shadow-button"
                >
                  Sí, guardar cambios
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 rounded-2xl bg-white border border-stone-200/90 text-xs font-bold text-stone-700 hover:bg-surface-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary text-white text-xs font-bold shadow-button hover:opacity-95 transition-opacity"
              >
                Guardar empleado
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}