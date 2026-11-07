import { useState, useEffect, useMemo } from 'react';
import { X, Lock, Check, Calendar, ShieldQuestion, Sparkles } from 'lucide-react';
import { getTodayISO } from '../../../utils/dateUtils';

const SERVICE_CATEGORIES = ['Cabello', 'Uñas', 'Mirada', 'Maquillaje', 'Facial'];

export default function ServiceFormModal({
  isOpen,
  onClose,
  onSave,
  mode = 'service', // 'service' | 'promotion'
  initialData = null,
  lockedCategory = null,
  isAdmin = false,
  existingItems = [],
  availableServices = [],
}) {
  const isEditing = Boolean(initialData);
  const isPromotion = mode === 'promotion';
  const canEditPrice = isAdmin;

  const [formData, setFormData] = useState({
    name: '',
    category: lockedCategory || 'Cabello',
    serviceIds: [],
    price: '',
    durationMinutes: '60', //60 es por defecto, si no se especifica otro valor
    validFrom: '',
    validUntil: '',
    status: 'Activo',
    description: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || lockedCategory || 'Cabello',
        serviceIds: initialData.serviceIds || [],
        price: initialData.price !== undefined ? String(initialData.price) : '',
        durationMinutes: initialData.durationMinutes !== undefined ? String(initialData.durationMinutes) : '60',
        validFrom: initialData.validFrom || getTodayISO(),
        validUntil: initialData.validUntil || getTodayISO(),
        status: initialData.status || 'Activo',
        description: initialData.description || '',
      });
    } else {
      setFormData({
        name: '',
        category: lockedCategory || 'Cabello',
        serviceIds: [],
        price: '',
        durationMinutes: '60',
        validFrom: getTodayISO(),
        validUntil: getTodayISO(),
        status: 'Activo',
        description: '',
      });
    }
    setFieldErrors({});
    setShowSaveConfirm(false);
  }, [initialData, isOpen, lockedCategory]);

  // Deducción automática de categoría según los servicios seleccionados en la promoción
  const derivedPromotionCategory = useMemo(() => {
    if (!isPromotion) return formData.category;
    const selectedObjs = availableServices.filter((s) =>
      formData.serviceIds.includes(s.id)
    );
    if (selectedObjs.length === 0) return 'Sin seleccionar';
    if (selectedObjs.length > 1) {
      const uniqueCategories = new Set(selectedObjs.map((s) => s.category));
      return uniqueCategories.size === 1
        ? [...uniqueCategories][0]
        : 'Paquete mixto';
    }
    return selectedObjs[0].category;
  }, [isPromotion, availableServices, formData.serviceIds, formData.category]);

  if (!isOpen) return null;

  const toggleServiceSelection = (serviceId) => {
    setFormData((prev) => {
      const exists = prev.serviceIds.includes(serviceId);
      const nextIds = exists
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId];

        const totalMinutes = availableServices
          .filter((s) => nextIds.includes(s.id))
          .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

      return { 
        ...prev, 
        serviceIds: nextIds,
        durationMinutes: totalMinutes > 0 ? String(totalMinutes) : prev.durationMinutes,};
    });
    if (fieldErrors.serviceIds) {
      setFieldErrors((prev) => ({ ...prev, serviceIds: undefined }));
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
    const trimmedDesc = formData.description.trim();

    if (!trimmedName || trimmedName.length < 3) {
      errors.name = 'Ingresa un nombre válido (mínimo 3 caracteres).';
    } else {
      const isDuplicate = existingItems.some(
        (item) =>
          item.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          item.id !== initialData?.id
      );
      if (isDuplicate) {
        errors.name = 'Ya existe un registro con este nombre.';
      }
    }

    if (!isPromotion) {
      const numericDuration = Number(formData.durationMinutes);
      if (
        !formData.durationMinutes ||
        Number.isNaN(numericDuration) ||
        !Number.isInteger(numericDuration) ||
        numericDuration < 10 ||
        numericDuration > 600
      ) {
        errors.durationMinutes = 'Ingresa una duración entre 10 y 600 min (10hrs).';
      }
    }

    if (canEditPrice) {
      const numericPrice = Number(formData.price);
      if (!formData.price || Number.isNaN(numericPrice) || numericPrice <= 0) {
        errors.price = 'Ingresa un precio mayor a $0 MXN.';
      } else if (numericPrice > 50000) {
        errors.price = 'El precio máximo es $50,000 MXN.';
      }
    }

    if (isPromotion) {
      if (formData.serviceIds.length === 0) {
        errors.serviceIds = 'Selecciona al menos un servicio de la lista.';
      }
      if (!formData.validFrom) {
        errors.validFrom = 'Selecciona la fecha de inicio.';
      }
      if (!formData.validUntil) {
        errors.validUntil = 'Selecciona la fecha de fin.';
      } else if (formData.validFrom && formData.validUntil < formData.validFrom) {
        errors.validUntil = 'La fecha final debe ser igual o posterior al inicio.';
      }
    }

    if (!trimmedDesc || trimmedDesc.length < 10) {
      errors.description = 'Ingresa una descripción (mínimo 10 caracteres).';
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
    const selectedServiceNames = availableServices
      .filter((s) => formData.serviceIds.includes(s.id))
      .map((s) => s.name.toUpperCase())
      .join(' + ');

    const finalCategory = isPromotion
      ? derivedPromotionCategory
      : formData.category;

    const payload = {
      name: formData.name.trim(),
      category: finalCategory,
      price: canEditPrice ? Number(formData.price) : initialData?.price,
      durationMinutes: Number(formData.durationMinutes),
      status: formData.status,
      description: formData.description.trim(),
      ...(isPromotion && {
        serviceIds: formData.serviceIds,
        serviceIncluded: selectedServiceNames,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
      }),
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
        className="relative w-full max-w-[660px] bg-white rounded-[32px] shadow-card border border-stone-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
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
            {isEditing ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-stone-900">
            {isEditing
              ? isPromotion
                ? 'Editar promoción'
                : 'Editar servicio'
              : isPromotion
              ? 'Agregar promoción'
              : 'Agregar servicio'}
          </h3>
          <p className="mt-1 text-sm text-stone-400">
            Completa la información para continuar.
          </p>
        </div>

        <form onSubmit={handleRequestSubmit} className="space-y-4" noValidate>
          {/* Fila 1: En Servicio muestra Nombre + Categoría */}
          <div className={`grid grid-cols-1 ${!isPromotion ? 'sm:grid-cols-2' : ''} gap-4`}>
            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                {isPromotion ? 'Nombre del paquete o promoción' : 'Nombre'}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={
                  isPromotion ? 'Ej. Glow de temporada' : 'Nombre del servicio'
                }
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none ${
                  fieldErrors.name ? 'border-red-400' : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-[11px] font-medium text-red-600 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {!isPromotion && (
              <div>
                <label className="block mb-2 text-xs font-bold text-stone-800">
                  Categoría
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={Boolean(lockedCategory)}
                  className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none disabled:opacity-70 ${
                    fieldErrors.category ? 'border-red-400' : 'border-stone-200/90 focus:border-brand-primary'
                  }`}
                >
                  <option value="">Seleccionar</option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="text-[11px] font-medium text-red-600 mt-1">
                    {fieldErrors.category}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Selector de Servicios Incluidos  */}
          {isPromotion && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-stone-800">
                  Servicios incluidos (Selecciona uno o más)
                </label>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDECEF] text-brand-primary">
                  Clasificación: {derivedPromotionCategory}
                </span>
              </div>
              <div
                className={`p-3 rounded-2xl bg-[#FAFAFB] border flex flex-wrap gap-2 ${
                  fieldErrors.serviceIds ? 'border-red-400' : 'border-stone-200/90'
                }`}
              >
                {availableServices.map((srv) => {
                  const isSelected = formData.serviceIds.includes(srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => toggleServiceSelection(srv.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-brand-primary text-white border-brand-primary shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-brand-light'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>{srv.name}</span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? 'text-brand-soft' : 'text-stone-400'
                        }`}
                      >
                        ({srv.category})
                      </span>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.serviceIds && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {fieldErrors.serviceIds}
                </p>
              )}
            </div>
          )}

          {/* Fila de Precio, Estado y Calendarios de Vigencia */}
          <div div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-stone-800">
                  Precio (MXN)
                </label>
                {!canEditPrice && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    Solo Admin
                  </span>
                )}
              </div>
              <input
                type="number"
                name="price"
                min="1"
                max="50000"
                step="10"
                value={formData.price}
                onChange={handleChange}
                disabled={!canEditPrice}
                placeholder="Ej. 450"
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none disabled:bg-stone-100 disabled:text-stone-500 ${
                  fieldErrors.price ? 'border-red-400' : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              />
              {fieldErrors.price && (
                <p className="text-[11px] font-medium text-red-600 mt-1">{fieldErrors.price}</p>
              )}
            </div>
           
              <div>
                <label className="block mb-2 text-xs font-bold text-stone-800">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  name="durationMinutes"
                  min="10"
                  max="600"
                  step="5"
                  value={formData.durationMinutes}
                  onChange={handleChange}
                  placeholder="Ej. 60"
                  className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none ${
                    fieldErrors.durationMinutes
                      ? 'border-red-400'
                      : 'border-stone-200/90 focus:border-brand-primary'
                  }`}
                />
                {fieldErrors.durationMinutes && (
                  <p className="text-[11px] font-medium text-red-600 mt-1">
                    {fieldErrors.durationMinutes}
                  </p>
                )}
              </div>
            

            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border border-stone-200/90 text-sm text-stone-800 focus:outline-none focus:border-brand-primary"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>
          
          {/* Fila de Fechas de Vigencia */}
          
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-${isPromotion ? '2' : '1'}`}>
            {isPromotion && (
              <>
                <div>
                  <label className="block mb-2 text-xs font-bold text-stone-800">
                    Fecha de inicio
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-brand-primary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-3.5 rounded-2xl bg-[#FAFAFB] border text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer ${
                        fieldErrors.validFrom ? 'border-red-400' : 'border-stone-200/90 focus:border-brand-primary'
                      }`}
                    />
                  </div>
                  {fieldErrors.validFrom && (
                    <p className="text-[11px] font-medium text-red-600 mt-1">
                      {fieldErrors.validFrom}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-xs font-bold text-stone-800">
                    Fecha de fin (Vigencia)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-brand-primary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      name="validUntil"
                      min={formData.validFrom || getTodayISO()}
                      value={formData.validUntil}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-3.5 rounded-2xl bg-[#FAFAFB] border text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer ${
                        fieldErrors.validUntil ? 'border-red-400' : 'border-stone-200/90 focus:border-brand-primary'
                      }`}
                    />
                  </div>
                  {fieldErrors.validUntil && (
                    <p className="text-[11px] font-medium text-red-600 mt-1">
                      {fieldErrors.validUntil}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Descripción */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-stone-800">
                Descripción o notas
              </label>
              <span className="text-[11px] text-stone-400">
                {formData.description.length}/220
              </span>
            </div>
            <textarea
              name="description"
              rows={3}
              maxLength={220}
              value={formData.description}
              onChange={handleChange}
              placeholder="Escribe información adicional..."
              className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none resize-none ${
                fieldErrors.description ? 'border-red-400' : 'border-stone-200/90 focus:border-brand-primary'
              }`}
            />
            {fieldErrors.description && (
              <p className="text-[11px] font-medium text-red-600 mt-1">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {showSaveConfirm ? (
            <div className="p-4 rounded-2xl bg-[#FDF2F5] border border-brand-light/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-brand-primary text-xs font-bold">
                <ShieldQuestion className="w-5 h-5 shrink-0" />
                <span>
                  ¿Estás seguro de que deseas guardar los cambios en este registro?
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
                {isPromotion ? 'Guardar promoción' : 'Guardar servicio'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}