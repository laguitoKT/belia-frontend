import { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Upload,
  Trash2,
  Box,
  ShieldQuestion,
} from 'lucide-react';

const PRODUCT_CATEGORIES = [
  'Cabello',
  'Coloración',
  'Uñas',
  'Mirada',
  'Maquillaje',
  'Facial',
];

const PRESENTATIONS = [
  'Botella',
  'Tubo',
  'Frasco',
  'Tarro',
  'Caja',
  'Bolsa',
  'Sobre',
  'Ampolleta',
];

const MEASUREMENT_UNITS = [
  { value: 'Mililitros', label: 'Mililitros (ml)' },
  { value: 'Litros', label: 'Litros (L)' },
  { value: 'Gramos', label: 'Gramos (g)' },
  { value: 'Kilogramos', label: 'Kilogramos (kg)' },
  { value: 'Onzas', label: 'Onzas (oz)' },
  { value: 'Piezas', label: 'Piezas (pzas)' },
];

export default function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  lockedCategory = null,
  isAdmin = false,
  existingProducts = [],
  isSaving = false,
}) {
  const isEditing = Boolean(initialData);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: lockedCategory || 'Cabello',
    presentation: '',
    measureUnit: '',
    quantity: '',
    imageUrl: null,
    imageFile: null,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || lockedCategory || 'Cabello',
        presentation: initialData.presentation || 'Botella',
        measureUnit: initialData.measureUnit || 'L',
        quantity:
          initialData.quantity !== undefined ? String(initialData.quantity) : '',
        imageUrl: initialData.imageUrl || null,
        imageFile: null,
      });
    } else {
      setFormData({
        name: '',
        category: lockedCategory || 'Cabello',
        presentation: '',
        measureUnit: '',
        quantity: '',
        imageUrl: null,
        imageFile: null,
      });
    }
    setFieldErrors({});
    setShowSaveConfirm(false);
  }, [initialData, isOpen, lockedCategory]);

  useEffect(() => {
    const imageUrl = formData.imageUrl;
    return () => {
      if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    };
  }, [formData.imageUrl]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        image: 'Formato no válido. Usa JPG, PNG o WEBP.',
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        image: 'La imagen no debe superar los 2 MB.',
      }));
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      imageUrl,
      imageFile: file,
    }));
    setFieldErrors((prev) => ({ ...prev, image: undefined }));
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: null, imageFile: null }));
    setFieldErrors((prev) => ({ ...prev, image: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const errors = {};
    if (fieldErrors.image) errors.image = fieldErrors.image;
    const trimmedName = formData.name.trim();

    if (!trimmedName || trimmedName.length < 3) {
      errors.name = 'Ingresa el nombre del producto (mínimo 3 caracteres).';
    } else {
      const isDuplicate = existingProducts.some(
        (p) =>
          p.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          p.id !== initialData?.id
      );
      if (isDuplicate) {
        errors.name = 'Ya existe un producto registrado con este nombre.';
      }
    }

    if (!formData.category) {
      errors.category = 'Selecciona una categoría.';
    }

    if (!formData.presentation) {
      errors.presentation = 'Selecciona la presentación.';
    }

    if (!formData.measureUnit) {
      errors.measureUnit = 'Selecciona la unidad de medición.';
    }
    const numericQty = Number(formData.quantity);
    if (
      formData.quantity === '' ||
      Number.isNaN(numericQty) ||
      !Number.isInteger(numericQty) ||
      numericQty < 0
    ) {
      errors.quantity = 'Ingresa una cantidad entera igual o mayor a 0.';
    } else if (numericQty > 9999) {
      errors.quantity = 'La cantidad máxima permitida es 9,999.';
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
    const qty = Number(formData.quantity);
    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      presentation: formData.presentation,
      measureUnit: formData.measureUnit,
      quantity: qty,
      imageUrl: formData.imageUrl,
      imageFile: formData.imageFile,
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
        className="responsive-dialog relative w-full max-w-3xl bg-white rounded-[32px] shadow-card border border-stone-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="absolute flex items-center justify-center transition-colors bg-white border top-5 right-5 sm:top-8 sm:right-8 w-11 h-11 rounded-2xl border-stone-200/80 text-stone-600 hover:text-brand-primary"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-12 mb-6">
          <span className="block text-xs font-bold tracking-[0.14em] text-brand-primary uppercase mb-1.5">
            {isEditing ? 'EDITAR EXISTENCIA' : 'NUEVO REGISTRO'}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-stone-900">
            {isEditing ? 'Editar producto' : 'Agregar producto'}
          </h3>
          <p className="mt-1 text-sm text-stone-400">
            Completa la información del insumo para el inventario.
          </p>
        </div>

        <form onSubmit={handleRequestSubmit} noValidate>
          <fieldset disabled={isSaving} className="space-y-4">
          {/* Imagen del producto */}
          <div>
            <label className="block mb-2 text-xs font-bold text-stone-800">
              Imagen del producto (Opcional)
            </label>
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#FAFAFB] border border-stone-200/90">
              <div className="w-14 h-14 rounded-2xl bg-[#FDECEF] flex items-center justify-center text-brand-primary overflow-hidden shrink-0 border border-brand-light/30">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Vista previa"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Box className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}</span>
                  </button>

                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 transition-colors rounded-xl bg-red-50 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Formatos JPG, PNG o WEBP (Máx. 2 MB).
                </p>
                {fieldErrors.image && (
                  <p className="text-[11px] font-medium text-red-600 mt-1">
                    {fieldErrors.image}
                  </p>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="sr-only"
              />
            </div>
          </div>

          {/* Fila 1: Nombre */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Nombre del producto
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Shampoo hidratante"
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
          </div>

          {/* Fila 2: Categoría, Presentación y Unidad de Medición */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Categoría del servicio
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={Boolean(lockedCategory)}
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none disabled:bg-stone-100 ${
                  fieldErrors.category
                    ? 'border-red-400'
                    : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              >
                <option value="">Seleccionar</option>
                {PRODUCT_CATEGORIES.map((cat) => (
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

            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Presentación
              </label>
              <select
                name="presentation"
                value={formData.presentation}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none cursor-pointer ${
                  fieldErrors.presentation
                    ? 'border-red-400'
                    : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              >
                <option value="">Seleccionar</option>
                {PRESENTATIONS.map((pres) => (
                  <option key={pres} value={pres}>
                    {pres}
                  </option>
                ))}
              </select>
              {fieldErrors.presentation && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {fieldErrors.presentation}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Unidad de medición
              </label>
              <select
                name="measureUnit"
                value={formData.measureUnit}
                onChange={handleChange}
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none cursor-pointer ${
                  fieldErrors.measureUnit
                    ? 'border-red-400'
                    : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              >
                <option value="">Seleccionar</option>
                {MEASUREMENT_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              {fieldErrors.measureUnit && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {fieldErrors.measureUnit}
                </p>
              )}
            </div>
          </div>

          {/* Fila 3: Cantidad disponible y Estado */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Cantidad disponible (Stock)
              </label>
              <input
                type="number"
                name="quantity"
                min="0"
                max="9999"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Ej. 18 (Si es 0 se desactiva)"
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none ${
                  fieldErrors.quantity
                    ? 'border-red-400'
                    : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              />
              {fieldErrors.quantity && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {fieldErrors.quantity}
                </p>
              )}
            </div>

            <div>
              <p className="block mb-2 text-xs font-bold text-stone-800">
                Estado del producto
              </p>
              <div className="w-full px-4 py-3.5 rounded-2xl bg-stone-100 border border-stone-200/90 text-sm text-stone-600">
                {formData.quantity === '' || !Number.isInteger(Number(formData.quantity)) || Number(formData.quantity) < 0
                  ? 'Ingresa una cantidad válida'
                  : Number(formData.quantity) === 0 ? 'Inactivo' : 'Activo'}
              </div>
              <p className="text-[11px] font-medium text-stone-500 mt-1">
                El estado se determina automáticamente según la cantidad.
              </p>
            </div>
          </div>

          {showSaveConfirm ? (
            <div className="p-4 rounded-2xl bg-[#FDF2F5] border border-brand-light/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-brand-primary text-xs font-bold">
                <ShieldQuestion className="w-5 h-5 shrink-0" />
                <span>
                  ¿Estás seguro de que deseas guardar los cambios en el inventario?
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
            <div className="flex flex-wrap items-center justify-end gap-3 pt-5 border-t border-stone-100">
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
                Guardar producto
              </button>
            </div>
          )}
          </fieldset>
          {isSaving && <p role="status" className="mt-4 text-sm text-stone-500">Guardando producto e imagen...</p>}
        </form>
      </div>
    </div>
  );
}