import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Minus,
  Search,
  Filter,
  Box,
  MoreHorizontal,
  LayoutGrid,
  Table2,
  Pencil,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../context/useAuth';
import useIsMobile from '../../../utils/useIsMobile';
import {
  inventoryService,
  getProductStockStatus,
} from '../services/inventoryService';
import ProductFormModal from '../components/ProductFormModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ProductDetailModal from '../components/ProductDetailModal';
import { getCategoryTheme } from '../../../components/ui/categoryThemes';

export default function InventoryPage() {
  const { user, isAdmin } = useAuth();

  const [viewMode, setViewMode] = useState('table');
  const isMobile = useIsMobile();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [operationError, setOperationError] = useState('');
  const pendingStockRef = useRef(new Set());
  const savingProductRef = useRef(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [pendingStock, setPendingStock] = useState(new Set());

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  const [openMenuId, setOpenMenuId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null,
    product: null,
  });

  const [feedbackBanner, setFeedbackBanner] = useState('');

  const showToast = (msg) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(''), 3200);
  };

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const data = await inventoryService.getProducts({ user });
        setProducts(data);
        setSelectedCategory('Todas');
      } catch (error) {
        console.error('Error al cargar el inventario:', error);
        setLoadError('No se pudo cargar el inventario. Revisa la conexión y vuelve a intentarlo.');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchInventory();
  }, [user]);

  const availableCategories = useMemo(
    () => ['Todas', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const statusInfo = getProductStockStatus(
        prod.quantity,
        prod.minStock,
        prod.active
      );
      const matchesSearch =
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.unit.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todas' || prod.category === selectedCategory;
      const matchesStatus =
        selectedStatus === 'Todos' || statusInfo.shortLabel === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  // Ajuste rápido de stock (+1 / -1) con desactivación automática al llegar a 0
  const handleQuickStockChange = async (product, delta) => {
    const nextQuantity = Math.max(0, Number(product.quantity) + delta);
    if (nextQuantity === product.quantity || pendingStockRef.current.has(product.id) || savingProductRef.current) return;

    pendingStockRef.current.add(product.id);
    setPendingStock(new Set(pendingStockRef.current));
    setOperationError('');
    try {
      const updated = await inventoryService.updateProduct(product.id, {
        quantity: nextQuantity,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updated : p))
      );
      if (nextQuantity === 0) {
        showToast(`"${product.name}" llegó a 0 unidades y se marcó automáticamente como Inactivo.`);
      } else {
        showToast(`Stock de "${product.name}" actualizado a ${nextQuantity} unidades.`);
      }
    } catch (error) {
      console.error('Error al actualizar el inventario:', error);
      setOperationError('No se pudo confirmar la actualización del inventario. Recarga la página para consultar el estado actual.');
    } finally {
      pendingStockRef.current.delete(product.id);
      setPendingStock(new Set(pendingStockRef.current));
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    if (pendingStockRef.current.has(product.id)) {
      setOperationError('Espera a que termine la actualización de existencias antes de editar el producto.');
      return;
    }
    setEditingProduct(product);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    if (savingProductRef.current) return;
    savingProductRef.current = true;
    setIsSavingProduct(true);
    setOperationError('');
    try {
      let saved;
      if (editingProduct) {
        saved = await inventoryService.updateProduct(
          editingProduct.id,
          formData
        );
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? saved : p))
        );
      } else {
        saved = await inventoryService.createProduct(formData);
        setProducts((prev) => [saved, ...prev]);
      }

      if (formData.imageFile) {
        try {
          const withImage = await inventoryService.uploadProductImage(saved.id, formData.imageFile);
          setProducts((prev) => prev.map((p) => (p.id === saved.id ? withImage : p)));
        } catch (error) {
          console.error('Error al subir la imagen del producto:', error);
          setOperationError(`El producto "${saved.name}" se guardó, pero no se pudo confirmar la subida de la imagen. Recarga el inventario y edita el producto para volver a intentarlo.`);
          setIsModalOpen(false);
          setEditingProduct(null);
          return;
        }
      }
      showToast(`Producto "${saved.name}" ${editingProduct ? 'actualizado' : 'agregado al inventario'}.`);
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      setOperationError(`No se pudo confirmar el guardado. Recarga el inventario antes de volver a intentarlo. ${error.message || ''}`);
    } finally {
      savingProductRef.current = false;
      setIsSavingProduct(false);
    }
  };

  const executeDelete = async () => {
    const prod = confirmState.product;
    if (!prod) return;
    await inventoryService.deleteProduct(prod.id);
    setProducts((prev) => prev.filter((p) => p.id !== prod.id));
    setConfirmState({ isOpen: false, type: null, product: null });
    showToast(`Producto "${prod.name}" eliminado.`);
  };

  return (
    <div
      className="responsive-page w-full space-y-6"
      onClick={() => openMenuId !== null && setOpenMenuId(null)}
    >
      {operationError && (
        <div role="alert" className="fixed top-6 right-6 z-[70] max-w-md rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 shadow-lg">
          {operationError}
          <button type="button" onClick={() => setOperationError('')} className="ml-3 font-bold">
            Cerrar
          </button>
        </div>
      )}
      {feedbackBanner && (
        <div className="fixed bottom-6 right-6 z-40 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Encabezado Superior */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="block mb-1 text-xs font-bold tracking-wider text-brand-primary">
            Existencias
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-stone-900">
            Inventario
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Controla los productos que hacen posible cada servicio.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center w-full gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary text-white text-xs font-bold shadow-button hover:opacity-95 active:scale-[0.99] transition-all self-start sm:w-auto sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo producto</span>
        </button>
      </div>

      {/* Barra de Herramientas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-1">
        <div className="grid grid-cols-2 flex-1 min-w-0 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative col-span-2 w-full sm:max-w-md">
            <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none text-stone-400 left-4 top-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full py-2.5 sm:py-3 pr-4 text-xs bg-white border pl-11 rounded-xl sm:rounded-2xl border-stone-100 text-stone-700 placeholder:text-stone-300 shadow-2xs focus:outline-none focus:border-brand-light"
            />
          </div>

          <div className="relative inline-flex items-center min-w-0">
            <Filter className="w-3.5 h-3.5 text-stone-500 absolute left-3 sm:left-4 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por categoría"
              className="w-full min-w-0 min-h-[40px] py-2 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-8 text-xs font-semibold bg-white border appearance-none cursor-pointer rounded-xl sm:rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none sm:w-auto"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Todas' ? 'Todos los filtros' : `Categoría: ${cat}`}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filtrar por estado de stock"
            className="w-full min-w-0 min-h-[40px] px-3 sm:px-4 py-2 sm:py-3 text-xs font-semibold bg-white border cursor-pointer rounded-xl sm:rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none sm:w-auto"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Óptimo">Óptimo</option>
            <option value="Bajo">Bajo</option>
            <option value="Crítico">Crítico</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* Conmutador de Vista (Tabla / Card) */}
        <div className="hidden sm:inline-flex items-center p-1 rounded-2xl bg-[#F2EEF0] border border-stone-200/60 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title="Vista de tabla"
            className={`p-2 rounded-xl transition-all ${
              viewMode === 'table'
                ? 'bg-white text-brand-primary shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Table2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            title="Vista de tarjetas"
            className={`p-2 rounded-xl transition-all ${
              viewMode === 'cards'
                ? 'bg-white text-brand-primary shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================== CONTENIDO DE INVENTARIO ==================== */}
      {isLoading ? (
        <div className="py-16 text-xs text-center text-stone-400">
          Cargando inventario...
        </div>
      ) : loadError ? (
        <div role="alert" className="py-16 text-sm text-center text-red-600">
          {loadError}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 text-center border border-stone-100 shadow-card">
          <p className="text-sm font-bold text-stone-700">
            No se encontraron productos con los filtros seleccionados
          </p>
        </div>
      ) : !isMobile && viewMode === 'table' ? (
        /* ==================== VISTA 1: TABLA ==================== */
        <div className="bg-white rounded-[28px] border border-stone-100/90 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className=" border-b border-stone-100 text-[11px] font-bold tracking-[0.12em] text-stone-400 uppercase">
                  <th className="py-5 pr-4 pl-7">PRODUCTO</th>
                  <th className="px-4 py-5">PRESENTACIÓN / UNIDAD</th>
                  <th className="px-4 py-5">CANTIDAD DISPONIBLE</th>
                  <th className="px-4 py-5">CATEGORÍA</th>
                  <th className="px-4 py-5">ESTADO</th>
                  <th className="py-5 pl-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-stone-100">
                {filteredProducts.map((prod) => {
                  const statusInfo = getProductStockStatus(
                    prod.quantity,
                    prod.minStock,
                    prod.active
                  );
                  const theme = getCategoryTheme(prod.category);

                  return (
                    <tr
                      key={prod.id}
                      onClick={() => setSelectedDetailProduct(prod)} 
                      className={`hover:bg-surface-bg/60 transition-colors cursor-pointer ${
                        !statusInfo.isActive ? 'opacity-65' : ''
                      }`}
                    >
                      <td className="py-4 pr-4 pl-7">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center shrink-0 overflow-hidden`}>
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <Box className="w-5 h-5" />
                            )}
                          </div>
                          <span className="text-sm font-bold text-stone-900">
                            {prod.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-stone-500">{prod.unit}</td>

                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2.5 bg-surface-bg px-2.5 py-1.5 rounded-2xl border border-stone-200/70">
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(prod, -1)}
                            disabled={prod.quantity <= 0 || pendingStock.has(prod.id) || isSavingProduct}
                            title="Descontar 1 unidad"
                            className="flex items-center justify-center w-6 h-6 transition-colors bg-white border rounded-lg border-stone-200 text-stone-600 hover:text-brand-primary disabled:opacity-40"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="min-w-[82px] text-center text-stone-500">
                            <strong className="font-bold text-stone-900">
                              {prod.quantity}
                            </strong>{' '}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(prod, 1)}
                            disabled={pendingStock.has(prod.id) || isSavingProduct}
                            title="Agregar 1 unidad"
                            className="flex items-center justify-center w-6 h-6 transition-colors bg-white border rounded-lg border-stone-200 text-stone-600 hover:text-brand-primary"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`px-3.5 py-1 rounded-full text-[11px] font-semibold ${theme.bg} ${theme.text}`}>
                          {prod.category}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-3.5 py-1 rounded-full text-[11px] font-semibold ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-4 pl-4 text-center pr-7"
                      onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#FADCE6] text-brand-primary text-xs font-bold hover:bg-brand-light/60 inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  isOpen: true,
                                  type: 'delete',
                                  product: prod,
                                })
                              }
                              className="p-2 transition-colors rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==================== VISTA 2: TARJETAS / CARDS ==================== */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((prod) => {
            const statusInfo = getProductStockStatus(
              prod.quantity,
              prod.minStock,
              prod.active
            );
            const theme = getCategoryTheme(prod.category);

            return (
              <div
                key={prod.id}
                onClick={() => setSelectedDetailProduct?.(prod)}
                className={`bg-white rounded-[28px] p-3.5 border border-stone-100/90 shadow-card flex items-stretch gap-4 relative hover:border-brand-light/50 transition-all cursor-pointer ${
                  !statusInfo.isActive ? 'opacity-70' : ''
                }`}
              >
                {/* Bloque Izquierdo Grande: Imagen del producto o bloque ilustrativo con categoría */}
                <div
                  className={`w-20 sm:w-36 rounded-[22px] ${theme.bg} relative overflow-hidden shrink-0 min-h-[152px] flex flex-col justify-between p-3 sm:p-4`}
                >
                  {prod.imageUrl ? (
                    <>
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="absolute inset-0 object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/65 via-stone-900/10 to-transparent" />
                      <div />
                      <span className="relative z-10 text-[10px] font-bold tracking-[0.14em] uppercase text-white drop-shadow-xs">
                        {prod.category}
                      </span>
                    </>
                  ) : (
                    <>
                      <div
                        className={`w-16 h-16 rounded-full ${theme.circle} absolute -top-3 -right-3 pointer-events-none`}
                      />
                      <Box
                        className={`w-6 h-6 ${theme.text} relative z-10 mt-1 stroke-[1.8]`}
                      />
                      <span
                        className={`text-[10px] font-bold tracking-[0.14em] uppercase ${theme.text} relative z-10`}
                      >
                        {prod.category}
                      </span>
                    </>
                  )}
                </div>

                {/* Contenido Derecho: Título, Presentación, Cantidad (- / +) y Estado */}
                <div className="flex flex-col justify-between flex-1 min-w-0 py-2 pr-2">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold leading-snug truncate text-stone-900">
                        {prod.name}
                      </h3>

                      {/* Menú (...) */}
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === prod.id ? null : prod.id
                            )
                          }
                          className="p-1 transition-colors rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                          aria-label="Opciones de producto"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openMenuId === prod.id && (
                          <div className="absolute right-0 top-7 w-44 bg-white rounded-2xl shadow-lg border border-stone-100 py-1.5 z-30 text-xs text-left">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(prod)}
                              className="w-full px-3.5 py-2 flex items-center gap-2 text-stone-700 hover:bg-surface-bg font-medium"
                            >
                              <Pencil className="w-3.5 h-3.5 text-brand-primary" />
                              Editar producto
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setConfirmState({
                                    isOpen: true,
                                    type: 'delete',
                                    product: prod,
                                  });
                                }}
                                className="w-full px-3.5 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subtítulo: Presentación y Unidad de medición */}
                    <p className="mt-1 text-xs truncate text-stone-400">
                      {prod.unit}
                    </p>
                  </div>

                  {/* Pie de tarjeta: Cantidad grande con botones (- / +) a la izquierda y Estado a la derecha */}
                  <div
                    className="flex flex-wrap items-end justify-between gap-2 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >

                    
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickStockChange(prod, -1)}
                          disabled={prod.quantity <= 0 || pendingStock.has(prod.id) || isSavingProduct}
                          className="flex items-center justify-center w-6 h-6 transition-colors border rounded-lg bg-surface-bg border-stone-200 text-stone-600 hover:text-brand-primary disabled:opacity-40"
                          title="Descontar 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-xl font-bold text-stone-900 tracking-tight leading-none min-w-[24px] text-center">
                          {prod.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleQuickStockChange(prod, 1)}
                          disabled={pendingStock.has(prod.id) || isSavingProduct}
                          className="flex items-center justify-center w-6 h-6 transition-colors border rounded-lg bg-surface-bg border-stone-200 text-stone-600 hover:text-brand-primary"
                          title="Agregar 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="block text-[11px] text-stone-400 mt-1">
                        disponibles
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          if (savingProductRef.current) return;
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialData={editingProduct}
        lockedCategory={
          !isAdmin && user?.specialtyCategory !== 'Cabello'
            ? user?.specialtyCategory
            : null
        }
        isAdmin={isAdmin || !editingProduct}
        existingProducts={products}
        isSaving={isSavingProduct}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() =>
          setConfirmState({ isOpen: false, type: null, product: null })
        }
        onConfirm={executeDelete}
        variant="danger"
        title={`¿Eliminar "${confirmState.product?.name}"?`}
        message="Este producto se eliminará permanentemente del inventario."
        confirmText="Sí, eliminar"
      />
      <ProductDetailModal
        product={selectedDetailProduct}
        isOpen={Boolean(selectedDetailProduct)}
        onClose={() => setSelectedDetailProduct(null)}
        onEdit={handleOpenEdit}
      />
    </div>
  );
}