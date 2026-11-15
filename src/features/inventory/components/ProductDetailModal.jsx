import {
  X,
  Box,
  Tag,
  Layers,
  AlertCircle,
  Pencil,
  Droplets,
  LayoutGridCircles,
} from 'lucide-react';
import { getProductStockStatus } from '../services/inventoryService';
import { getCategoryTheme } from '../../../components/ui/categoryThemes';

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onEdit,
}) {
  if (!isOpen || !product) return null;

  const statusInfo = getProductStockStatus(
    product.quantity,
    product.minStock,
    product.active
  );
  const theme = getCategoryTheme(product.category);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-[30px] shadow-card border border-stone-100 p-7 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />

        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center transition-colors top-5 right-5 w-9 h-9 rounded-xl bg-surface-bg text-stone-400 hover:text-brand-primary"
          aria-label="Cerrar detalle de producto"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado con Imagen o Icono del Producto */}
        <div className="flex items-center gap-4 pr-8 mt-2 mb-6">
          <div className={`w-20 h-20 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center overflow-hidden shrink-0 border border-brand-light/30`}>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <Box className="w-8 h-8" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-[0.14em] text-brand-primary uppercase">
                FICHA DE INSUMO #{product.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.badgeClass}`}
              >
                {statusInfo.label}
              </span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-stone-900">
              {product.name}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Presentación completa: {product.unit}
            </p>
          </div>
        </div>

        {/* Especificaciones del Producto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface-bg p-4 rounded-2xl border border-stone-100 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <LayoutGridCircles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Categoría del servicio
              </p>
              <p className={`font-bold ${theme.text}`}>{product.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Existencias actuales
              </p>
              <p className="text-base font-bold text-stone-900">
                {product.quantity} unidades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Tipo de envase / Presentación
              </p>
              <p className="font-bold text-stone-800">
                {product.presentation || 'Estándar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-brand-primary shadow-2xs shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-stone-400">
                Tipo de unidad
              </p>
              <p className="font-bold text-stone-800">
                {product.measureValue} {product.measureUnit}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t sm:col-span-2 border-stone-200/60">
            <div className="flex items-center justify-center bg-white w-9 h-9 rounded-xl text-amber-600 shadow-2xs shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-700">
                Stock mínimo sugerido: {product.minStock || 8} unidades.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
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