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

export default function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  lockedCategory = null,
  isAdmin = false,
  existingProducts = [],
}) {
  const isEditing = Boolean(initialData);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: lockedCategory || 'Cabello',
    unit: '',
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
        unit: initialData.unit || '',
        quantity:
          initialData.quantity !== undefined ? String(initialData.quantity) : '',
        imageUrl: initialData.imageUrl || null,
        imageFile: null,
      });
    } else {
      setFormData({
        name: '',
        category: lockedCategory || 'Cabello',
        unit: '',
        quantity: '',
        imageUrl: null,
        imageFile: null,
      });
    }
    setFieldErrors({});
    setShowSaveConfirm(false);
  }, [initialData, isOpen, lockedCategory]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Manejo de subida de imagen con validación de formato y tamaño (máx 2MB)
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        imageUrl: reader.result,
        imageFile: file, // Listo para enviarse como UploadFile a FastAPI
      }));
      setFieldErrors((prev) => ({ ...prev, image: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: null, imageFile: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedUnit = formData.unit.trim();

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

    if (!trimmedUnit || trimmedUnit.length < 2) {
      errors.unit = 'Especifica la unidad (ej. Botella 1 L, Tubo 90 ml).';
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
    const payload = {
      name: isAdmin ? formData.name.trim() : initialData?.name,
      category: isAdmin ? formData.category : initialData?.category,
      unit: isAdmin ? formData.unit.trim() : initialData?.unit,
      quantity: Number(formData.quantity),
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
        className="relative w-full max-w-[640px] bg-white rounded-[32px] shadow-card border border-stone-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
            {isEditing ? 'EDITAR EXISTENCIA' : 'NUEVO REGISTRO'}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-stone-900">
            {isEditing ? 'Editar producto' : 'Agregar producto'}
          </h3>
          <p className="mt-1 text-sm text-stone-400">
            Completa la información del insumo para el inventario.
          </p>
        </div>

        <form onSubmit={handleRequestSubmit} className="space-y-5" noValidate>
          {/* Carga y previsualización de Imagen del Producto */}
          <div>
            <label className="block mb-2 text-xs font-bold text-stone-800">
              Imagen del producto (Opcional)
            </label>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAFAFB] border border-stone-200/90">
              <div className="w-16 h-16 rounded-2xl bg-[#FDECEF] flex items-center justify-center text-brand-primary overflow-hidden shrink-0 border border-brand-light/30">
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
                <p className="text-[11px] text-stone-400 mt-1.5">
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

          {/* Fila 1: Nombre del Producto y Categoría del Servicio */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-stone-800">
                  Nombre del producto
                </label>
                {!isAdmin && isEditing && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    Solo Admin
                  </span>
                )}
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isAdmin && isEditing}
                placeholder="Ej. Shampoo hidratante"
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none disabled:bg-stone-100 disabled:text-stone-500 ${
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
                Categoría del servicio
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={Boolean(lockedCategory) || (!isAdmin && isEditing)}
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none disabled:bg-stone-100 disabled:text-stone-500 ${
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
          </div>

          {/* Fila 2: Unidad y Cantidad disponible */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-stone-800">
                  Unidad / Presentación
                </label>
                {!isAdmin && isEditing && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    Solo Admin
                  </span>
                )}
              </div>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                disabled={!isAdmin && isEditing}
                placeholder="Ej. Botella 1 L, Tubo 90 ml"
                className={`w-full px-4 py-3.5 rounded-2xl bg-[#FAFAFB] border text-sm text-stone-800 focus:outline-none disabled:bg-stone-100 disabled:text-stone-500 ${
                  fieldErrors.unit
                    ? 'border-red-400'
                    : 'border-stone-200/90 focus:border-brand-primary'
                }`}
              />
              {fieldErrors.unit && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {fieldErrors.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-xs font-bold text-stone-800">
                Cantidad disponible (Unidades)
              </label>
              <input
                type="number"
                name="quantity"
                min="0"
                max="9999"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Ej. 18"
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
          </div>

          {/* Confirmación antes de guardar ("¿Estás seguro? / Guardar cambios") */}
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
                Guardar producto
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}