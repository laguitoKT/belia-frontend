import { useState, useEffect } from 'react';
import { X, ShieldQuestion } from 'lucide-react';

export default function ClientFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  existingClients = [],
}) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
      });
    }
    setFieldErrors({});
    setShowSaveConfirm(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

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
      const isDuplicate = existingClients.some(
        (c) =>
          c.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          c.id !== initialData?.id
      );
      if (isDuplicate) {
        errors.name = 'Ya existe un cliente registrado con este nombre.';
      }
    }

    if (digitsOnly.length < 10) {
      errors.phone = 'Ingresa un teléfono válido de al menos 10 dígitos.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      errors.email = 'Ingresa un correo electrónico válido.';
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
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      notes: formData.notes.trim(),
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
        className="responsive-dialog relative w-full max-w-[640px] bg-white rounded-[32px] shadow-card border border-stone-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
     <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />
        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors bg-white border top-5 right-5 sm:top-8 sm:right-8 w-11 h-11 rounded-2xl border-stone-200/80 text-stone-600 hover:text-brand-primary"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-12 mb-6">
          <span className="block text-xs font-bold tracking-[0.14em] text-brand-primary uppercase mb-1.5">
            {isEditing ? 'EDITAR EXPEDIENTE' : 'NUEVO REGISTRO'}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-stone-900">
            {isEditing ? 'Editar cliente' : 'Agregar cliente'}
          </h3>
          <p className="mt-1 text-sm text-stone-400">
            Completa los datos de contacto e historial del cliente.
          </p>
        </div>

        <form onSubmit={handleRequestSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block mb-2 text-xs font-bold text-stone-800">
              Nombre del cliente
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej. Sofía Mendoza"
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
                placeholder="Ej. 55 1234 6678"
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
                placeholder="Ej. sofia.m@email.com"
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
              Notas o preferencias del cliente
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ej. Alergias, tonos frecuentes o preferencias..."
              className="w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border border-stone-200/90 text-sm text-stone-800 focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>

          {showSaveConfirm ? (
            <div className="p-4 rounded-2xl bg-[#FDF2F5] border border-brand-light/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-brand-primary text-xs font-bold">
                <ShieldQuestion className="w-5 h-5 shrink-0" />
                <span>
                  ¿Estás seguro de que deseas guardar los datos de este cliente?
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
                  Sí, guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 mt-6 justify-items-end sm:flex-row sm:justify-end sm:gap-2.5 flex-col">
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary text-white text-xs font-bold shadow-button hover:opacity-95 transition-opacity"
              >
                Guardar cliente
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}