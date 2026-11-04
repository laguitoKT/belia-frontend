import { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '../../../context/AuthContext';
import {
  inventoryService,
  getProductStockStatus,
} from '../services/inventoryService';
import ProductFormModal from '../components/ProductFormModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

export default function InventoryPage() {
  const { user, isAdmin } = useAuth();

  const [viewMode, setViewMode] = useState('table');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  const [openMenuId, setOpenMenuId] = useState(null);

  // Estados de modales CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [feedbackBanner, setFeedbackBanner] = useState('');

  const showToast = (msg) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(''), 3000);
  };

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        const data = await inventoryService.getProducts({ user });
        setProducts(data);
        setSelectedCategory('Todas');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchInventory();
  }, [user]);

  const availableCategories = useMemo(() => {
    if (!isAdmin && user?.specialtyCategory) {
      return user.specialtyCategory === 'Cabello'
        ? ['Todas', 'Cabello', 'Coloración']
        : [user.specialtyCategory];
    }
    return [
      'Todas',
      'Cabello',
      'Coloración',
      'Uñas',
      'Mirada',
      'Maquillaje',
      'Facial',
    ];
  }, [isAdmin, user]);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const statusInfo = getProductStockStatus(prod.quantity, prod.minStock);
      const matchesSearch =
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.unit.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todas' || prod.category === selectedCategory;
      const matchesStatus =
        selectedStatus === 'Todos' || statusInfo.label === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  // ==================== AJUSTE RÁPIDO DE CANTIDAD (+1 / -1) ====================
  const handleQuickStockChange = async (product, delta) => {
    const nextQuantity = Math.max(0, Number(product.quantity) + delta);
    if (nextQuantity === product.quantity) return;

    const updated = await inventoryService.updateProduct(product.id, {
      ...product,
      quantity: nextQuantity,
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? updated : p))
    );
    showToast(
      `Stock de "${product.name}" actualizado a ${nextQuantity} unidades.`
    );
  };

  // ==================== HANDLERS CRUD ====================
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    if (editingProduct) {
      const updated = await inventoryService.updateProduct(
        editingProduct.id,
        formData
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? updated : p))
      );
      showToast(`Producto "${updated.name}" actualizado.`);
    } else {
      const created = await inventoryService.createProduct(formData);
      setProducts((prev) => [created, ...prev]);
      showToast(`Producto "${created.name}" agregado al inventario.`);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await inventoryService.deleteProduct(productToDelete.id);
    setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
    showToast(`Producto "${productToDelete.name}" eliminado.`);
    setProductToDelete(null);
  };

  return (
    <div
      className="w-full space-y-6"
      onClick={() => openMenuId !== null && setOpenMenuId(null)}
    >
      {feedbackBanner && (
        <div className="fixed bottom-6 right-6 z-40 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Encabezado Superior con botón + Nuevo producto siempre visible */}
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
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary text-white text-xs font-bold shadow-button hover:opacity-95 active:scale-[0.99] transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo producto</span>
        </button>
      </div>

      {/* Barra de Herramientas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pt-1">
        <div className="flex flex-col items-stretch flex-1 gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none text-stone-400 left-4 top-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full py-3 pr-4 text-xs bg-white border pl-11 rounded-2xl border-stone-100 text-stone-700 placeholder:text-stone-300 shadow-2xs focus:outline-none focus:border-brand-light"
            />
          </div>

          <div className="relative inline-flex items-center">
            <Filter className="w-3.5 h-3.5 text-stone-500 absolute left-4 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por categoría"
              className="py-3 pl-10 pr-8 text-xs font-semibold bg-white border appearance-none cursor-pointer rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none"
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
            className="px-4 py-3 text-xs font-semibold bg-white border cursor-pointer rounded-2xl border-stone-100 text-stone-600 shadow-2xs focus:outline-none"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Óptimo">Óptimo</option>
            <option value="Bajo">Bajo</option>
            <option value="Crítico">Crítico</option>
          </select>
        </div>

        {/* Conmutador de Vista (Tabla / Card) */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#F2EEF0] border border-stone-200/60 self-end md:self-auto">
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
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 text-center border border-stone-100 shadow-card">
          <p className="text-sm font-bold text-stone-700">
            No se encontraron productos con los filtros seleccionados
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Intenta cambiar la categoría o el término de búsqueda.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* ==================== VISTA 1: TABLA CON CONTROLES RÁPIDOS (- / +) Y ACCIONES ESTILO SERVICIOS ==================== */
        <div className="bg-white rounded-[28px] border border-stone-100/90 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-bold tracking-[0.12em] text-stone-400 uppercase">
                  <th className="py-5 pr-4 pl-7">PRODUCTO</th>
                  <th className="px-4 py-5">UNIDAD</th>
                  <th className="px-4 py-5">CANTIDAD</th>
                  <th className="px-4 py-5">CATEGORÍA</th>
                  <th className="px-4 py-5">ESTADO</th>
                  <th className="py-5 pl-4 text-right pr-7">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-stone-100">
                {filteredProducts.map((prod) => {
                  const statusInfo = getProductStockStatus(
                    prod.quantity,
                    prod.minStock
                  );

                  return (
                    <tr
                      key={prod.id}
                      className="transition-colors hover:bg-surface-bg/60"
                    >
                      <td className="py-4 pr-4 pl-7">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-[#FDECEF] flex items-center justify-center text-brand-primary shrink-0 overflow-hidden">
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

                      {/* Control rápido para descontar (-) o agregar (+) existencias */}
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2.5 bg-surface-bg px-2.5 py-1.5 rounded-2xl border border-stone-200/70">
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(prod, -1)}
                            disabled={prod.quantity <= 0}
                            title="Descontar 1 unidad"
                            className="flex items-center justify-center w-6 h-6 transition-colors bg-white border rounded-lg border-stone-200 text-stone-600 hover:text-brand-primary hover:border-brand-light disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="min-w-[82px] text-center text-stone-500">
                            <strong className="font-bold text-stone-900">
                              {prod.quantity}
                            </strong>{' '}
                            disponibles
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(prod, 1)}
                            title="Agregar 1 unidad"
                            className="flex items-center justify-center w-6 h-6 transition-colors bg-white border rounded-lg border-stone-200 text-stone-600 hover:text-brand-primary hover:border-brand-light"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#FDECEF] text-brand-primary">
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

                      {/* Acciones directas igual que en el módulo de Servicios */}
                      <td className="py-4 pl-4 text-right pr-7">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#FADCE6] text-brand-primary text-xs font-bold hover:bg-brand-light/60 inline-flex items-center gap-1.5 transition-colors"
                            title="Editar producto"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setProductToDelete(prod)}
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
        /* ==================== VISTA 2: TARJETAS / CARDS CON AJUSTE RÁPIDO (- / +) ==================== */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((prod) => {
            const statusInfo = getProductStockStatus(
              prod.quantity,
              prod.minStock
            );

            return (
              <div
                key={prod.id}
                className="bg-white rounded-[30px] p-7 border border-stone-100/90 shadow-card flex flex-col items-center text-center relative hover:border-brand-light/50 transition-all"
              >
                {/* Menú (...) en la esquina superior derecha */}
                <div
                  className="absolute top-5 right-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(openMenuId === prod.id ? null : prod.id)
                    }
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    aria-label="Opciones de producto"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {openMenuId === prod.id && (
                    <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-lg border border-stone-100 py-1.5 z-30 text-xs text-left">
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
                            setProductToDelete(prod);
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

                {/* Icono de cubo o Imagen del producto centrada */}
                <div className="w-16 h-16 rounded-[22px] bg-[#FDECEF] flex items-center justify-center text-brand-primary mb-5 overflow-hidden shrink-0">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Box className="w-7 h-7 stroke-[1.8]" />
                  )}
                </div>

                {/* Nombre del producto */}
                <h3 className="text-lg font-bold text-stone-900 tracking-tight mb-2.5">
                  {prod.name}
                </h3>

                {/* Pill de Categoría */}
                <span className="px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#FDECEF] text-brand-primary mb-6">
                  {prod.category}
                </span>

                {/* Bloque central de Cantidad + Unidad con botones rápidos (- / +) */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => handleQuickStockChange(prod, -1)}
                    disabled={prod.quantity <= 0}
                    title="Descontar 1 unidad"
                    className="flex items-center justify-center w-8 h-8 transition-colors border rounded-xl bg-surface-bg border-stone-200 text-stone-600 hover:text-brand-primary hover:border-brand-light disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-2.5">
                    <span className="text-4xl font-bold leading-none tracking-tight text-stone-900">
                      {prod.quantity}
                    </span>
                    <div className="leading-tight text-left">
                      <span className="block text-xs text-stone-400">
                        unidades
                      </span>
                      <span className="block text-[11px] text-stone-400">
                        {prod.unit}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickStockChange(prod, 1)}
                    title="Agregar 1 unidad"
                    className="flex items-center justify-center w-8 h-8 transition-colors border rounded-xl bg-surface-bg border-stone-200 text-stone-600 hover:text-brand-primary hover:border-brand-light"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Badge inferior de Estado (Óptimo / Bajo / Crítico) */}
                <span
                  className={`px-4 py-1 rounded-full text-[11px] font-semibold ${statusInfo.badgeClass}`}
                >
                  {statusInfo.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Agregar o Editar Producto */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
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
      />

      {/* Modal de Advertencia antes de Eliminar */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title={`¿Eliminar "${productToDelete?.name}"?`}
        message="Este producto se eliminará permanentemente del inventario y dejará de contabilizarse en las existencias del salón."
        confirmText="Sí, eliminar producto"
      />
    </div>
  );
}