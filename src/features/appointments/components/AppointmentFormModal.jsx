import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Calendar,
  Clock,
  Check,
  History,
  AlertCircle,
  ShieldQuestion,
  Sparkles,
  Scissors,
  Mail,
  Phone,
  User,
  UserCheck,
  ArrowDown,
} from 'lucide-react';
import { getTodayISO, parseLocalDate } from '../../../utils/dateUtils';
import { calculateEndTime } from '../services/appointmentsService';

const ALL_CATEGORIES = [
  'Cabello',
  'Coloración',
  'Uñas',
  'Mirada',
  'Maquillaje',
  'Facial',
];

const JS_DAY_TO_ID = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Verifica si la especialidad del empleado corresponde a la categoría del servicio
const matchesSpecialty = (empCategory = '', serviceCategory = '') => {
  if (!serviceCategory || serviceCategory === 'Paquete mixto') return true;
  const normEmp = empCategory.toLowerCase();
  const normSrv = serviceCategory.toLowerCase();
  if (normEmp === normSrv) return true;
  if (
    (normEmp === 'cabello' || normEmp === 'coloración') &&
    (normSrv === 'cabello' || normSrv === 'coloración')
  ) {
    return true;
  }
  return false;
};

// Evalúa si un empleado está disponible en una fecha y rango de horas específico
const evaluateEmployeeSlotAvailability = (
  employee,
  dateISO,
  slotStart,
  slotEnd,
  existingAppointments = [],
  editingAppointmentId = null
) => {
  if (!employee || !dateISO || !slotStart || !slotEnd) {
    return { available: false, reason: 'Horario incompleto' };
  }

  const dateObj = parseLocalDate(dateISO);
  const dayCode = JS_DAY_TO_ID[dateObj.getDay()];

  if (
    Array.isArray(employee.workDaysList) &&
    !employee.workDaysList.includes(dayCode)
  ) {
    return {
      available: false,
      reason: `No labora los ${dayCode} (${employee.workDays})`,
    };
  }

  if (slotStart < employee.startTime || slotEnd > employee.endTime) {
    return {
      available: false,
      reason: `Fuera de turno (${employee.startTime}–${employee.endTime})`,
    };
  }

  const conflict = existingAppointments.find((apt) => {
    if (apt.id === editingAppointmentId) return false;
    if (apt.date !== dateISO) return false;

    // Verificar si el empleado está asignado en la cita principal o en alguno de sus tramos
    const isAssigned =
      String(apt.employeeId) === String(employee.id) ||
      apt.serviceBreakdown?.some(
        (b) => String(b.employeeId) === String(employee.id)
      );

    if (!isAssigned) return false;

    // Si tiene desglose por tramos, validar contra el tramo específico de ese empleado
    if (Array.isArray(apt.serviceBreakdown) && apt.serviceBreakdown.length > 0) {
      return apt.serviceBreakdown.some(
        (b) =>
          String(b.employeeId) === String(employee.id) &&
          slotStart < b.endTime &&
          slotEnd > b.startTime
      );
    }

    return slotStart < apt.endTime && slotEnd > apt.startTime;
  });

  if (conflict) {
    return {
      available: false,
      reason: `Ocupado (${conflict.startTime}–${conflict.endTime})`,
    };
  }

  return { available: true, reason: 'Disponible en este horario' };
};

export default function AppointmentFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  defaultDate = null,
  catalogServices = [],
  catalogPromotions = [],
  clientsList = [],
  employeesList = [],
  existingAppointments = [],
  currentUser = null,
  isAdmin = false,
}) {
  const isEditing = Boolean(initialData);

  const [clientMode, setClientMode] = useState('existing');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(ALL_CATEGORIES);
  const [selectedItemKeys, setSelectedItemKeys] = useState([]);

  // Mapa de empleado elegido por cada tramo de servicio: { [slotKey]: employeeId }
  const [slotEmployeeMap, setSlotEmployeeMap] = useState({});

  const [formData, setFormData] = useState({
    clientId: '',
    client: '',
    clientPhone: '',
    clientEmail: '',
    specification: '',
    date: defaultDate || getTodayISO(),
    startTime: '09:00',
    status: 'Pendiente',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // 1. Catálogo unificado (Servicios + Paquetes con sus sub-servicios reales)
  const unifiedCatalog = useMemo(() => {
    const activeServices = catalogServices
      .filter((s) => s.status === 'Activo')
      .map((s) => ({
        key: `srv-${s.id}`,
        id: s.id,
        type: 'service',
        name: s.name,
        category: s.category,
        involvedCategories: [s.category],
        durationMinutes: Number(s.durationMinutes) || 60,
        price: Number(s.price) || 0,
        description: s.description || '',
        subServices: [
          {
            subKey: `srv-${s.id}`,
            name: s.name,
            category: s.category,
            durationMinutes: Number(s.durationMinutes) || 60,
          },
        ],
      }));

    const activePromos = catalogPromotions
      .filter((p) => p.status === 'Activo')
      .map((p) => {
        const includedSrvs = catalogServices.filter((s) =>
          p.serviceIds?.includes(s.id)
        );
        const catsFromServices = Array.from(
          new Set(includedSrvs.map((s) => s.category))
        );
        const involvedCategories =
          catsFromServices.length > 0
            ? catsFromServices
            : p.category === 'Paquete mixto'
            ? ALL_CATEGORIES
            : [p.category];

        // Desglosa los servicios que componen el paquete para asignar horario y empleado a cada uno
        const subServices =
          includedSrvs.length > 0
            ? includedSrvs.map((s) => ({
                subKey: `promo-${p.id}-srv-${s.id}`,
                name: `${s.name} (${p.name})`,
                category: s.category,
                durationMinutes: Number(s.durationMinutes) || 45,
              }))
            : [
                {
                  subKey: `promo-${p.id}-main`,
                  name: p.name,
                  category: p.category,
                  durationMinutes: Number(p.durationMinutes) || 90,
                },
              ];

        return {
          key: `promo-${p.id}`,
          id: p.id,
          type: 'promotion',
          name: p.name,
          serviceIncluded: p.serviceIncluded,
          category: p.category,
          involvedCategories,
          durationMinutes: Number(p.durationMinutes) || 90,
          price: Number(p.price) || 0,
          description: `${p.serviceIncluded} — ${p.description || ''}`,
          subServices,
        };
      });

    return [...activeServices, ...activePromos];
  }, [catalogServices, catalogPromotions]);

  // 2. Elementos visibles según rol y filtro de categorías
  const visibleCatalogItems = useMemo(() => {
    if (!isAdmin && currentUser?.specialtyCategory) {
      const userCat = currentUser.specialtyCategory;
      const allowedUserCats =
        userCat === 'Cabello' ? ['Cabello', 'Coloración'] : [userCat];

      return unifiedCatalog.filter((item) => {
        if (item.type === 'service') {
          return allowedUserCats.includes(item.category);
        }
        return (
          item.involvedCategories.some((c) => allowedUserCats.includes(c)) ||
          item.category === 'Paquete mixto'
        );
      });
    }

    if (selectedCategories.length === 0) return [];
    return unifiedCatalog.filter((item) => {
      if (item.type === 'service') {
        return selectedCategories.includes(item.category);
      }
      return (
        item.involvedCategories.some((c) => selectedCategories.includes(c)) ||
        item.category === 'Paquete mixto'
      );
    });
  }, [unifiedCatalog, isAdmin, currentUser, selectedCategories]);

  // 3. Desglose secuencial de servicios con cálculo automático de horarios encadenados
  const scheduledServiceSlots = useMemo(() => {
    const selectedItems = unifiedCatalog.filter((item) =>
      selectedItemKeys.includes(item.key)
    );

    const rawSteps = selectedItems.flatMap((item) => item.subServices);
    let runningStartTime = formData.startTime || '09:00';

    return rawSteps.map((step, index) => {
      const slotStart = runningStartTime;
      const slotEnd = calculateEndTime(slotStart, step.durationMinutes);
      runningStartTime = slotEnd; // El siguiente servicio inicia cuando termina el anterior

      // Filtrar empleados de la categoría correspondiente y evaluar su disponibilidad en este tramo horario
      const activeEmps = employeesList.filter((e) => e.active !== false);
      const categoryEmps = activeEmps.filter((e) =>
        matchesSpecialty(e.specialtyCategory, step.category)
      );
      const candidates = categoryEmps.length > 0 ? categoryEmps : activeEmps;

      const evaluatedCandidates = candidates.map((emp) => ({
        ...emp,
        availability: evaluateEmployeeSlotAvailability(
          emp,
          formData.date,
          slotStart,
          slotEnd,
          existingAppointments,
          initialData?.id
        ),
      }));

      return {
        ...step,
        stepIndex: index + 1,
        startTime: slotStart,
        endTime: slotEnd,
        candidates: evaluatedCandidates,
      };
    });
  }, [
    unifiedCatalog,
    selectedItemKeys,
    formData.startTime,
    formData.date,
    employeesList,
    existingAppointments,
    initialData,
  ]);

  // 4. Autoseleccionar por cada tramo al primer especialista disponible en ese horario
  useEffect(() => {
    if (!isOpen) return;
    setSlotEmployeeMap((prev) => {
      const next = { ...prev };
      scheduledServiceSlots.forEach((slot) => {
        const currentSelectedId = next[slot.subKey];
        const stillValid = slot.candidates.some(
          (c) => String(c.id) === String(currentSelectedId)
        );

        if (!stillValid) {
          // Si no es admin y el usuario actual pertenece a la categoría, asignarlo por defecto en su tramo
          const selfMatch =
            !isAdmin &&
            slot.candidates.find((c) => String(c.id) === String(currentUser?.id));
          const firstAvailable = slot.candidates.find(
            (c) => c.availability.available
          );
          const fallback = selfMatch || firstAvailable || slot.candidates[0];
          if (fallback) {
            next[slot.subKey] = String(fallback.id);
          }
        }
      });
      return next;
    });
  }, [scheduledServiceSlots, isOpen, isAdmin, currentUser]);

  // 5. Resumen general de la cita (duración total, hora final, precio total y nombres de empleados)
  const appointmentTotals = useMemo(() => {
    const selectedItems = unifiedCatalog.filter((item) =>
      selectedItemKeys.includes(item.key)
    );
    const totalPrice = selectedItems.reduce((acc, i) => acc + i.price, 0);
    const totalDuration = scheduledServiceSlots.reduce(
      (acc, s) => acc + s.durationMinutes,
      0
    );
    const finalEndTime =
      scheduledServiceSlots.length > 0
        ? scheduledServiceSlots[scheduledServiceSlots.length - 1].endTime
        : calculateEndTime(formData.startTime, 60);

    const combinedServiceNames = selectedItems.map((i) => i.name).join(' + ');
    const uniqueCats = Array.from(
      new Set(scheduledServiceSlots.map((s) => s.category))
    );
    const primaryCategory =
      uniqueCats.length > 1 ? 'Paquete mixto' : uniqueCats[0] || 'Cabello';

    return {
      totalPrice,
      totalDuration,
      finalEndTime,
      combinedServiceNames,
      primaryCategory,
      uniqueCats,
    };
  }, [
    unifiedCatalog,
    selectedItemKeys,
    scheduledServiceSlots,
    formData.startTime,
  ]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return [];
    return clientsList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    );
  }, [clientsList, clientSearch]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedCategories(ALL_CATEGORIES);
    setClientSearch('');
    setFieldErrors({});
    setShowSaveConfirm(false);

    if (initialData) {
      setClientMode('existing');
      const parts = (initialData.service || '')
        .split('+')
        .map((s) => s.trim().toLowerCase());
      const matchedKeys = unifiedCatalog
        .filter((item) => parts.includes(item.name.toLowerCase()))
        .map((item) => item.key);

      setSelectedItemKeys(
        matchedKeys.length > 0
          ? matchedKeys
          : unifiedCatalog[0]
          ? [unifiedCatalog[0].key]
          : []
      );

      // Restaurar empleados asignados por tramo si existían
      if (Array.isArray(initialData.serviceBreakdown)) {
        const restoredMap = {};
        initialData.serviceBreakdown.forEach((b) => {
          restoredMap[b.subKey] = String(b.employeeId);
        });
        setSlotEmployeeMap(restoredMap);
      } else {
        setSlotEmployeeMap({});
      }

      setFormData({
        clientId: initialData.clientId ? String(initialData.clientId) : '',
        client: initialData.client || '',
        clientPhone: initialData.clientPhone || '',
        clientEmail: initialData.clientEmail || '',
        specification: initialData.specification || '',
        date: initialData.date || defaultDate || getTodayISO(),
        startTime: initialData.startTime || '09:00',
        status: initialData.status || 'Pendiente',
      });
    } else {
      const firstItem = visibleCatalogItems[0] || unifiedCatalog[0] || null;

      setClientMode(clientsList.length > 0 ? 'existing' : 'new');
      setSelectedItemKeys(firstItem ? [firstItem.key] : []);
      setSlotEmployeeMap({});

      setFormData({
        clientId: '',
        client: '',
        clientPhone: '',
        clientEmail: '',
        specification: firstItem ? firstItem.description : '',
        date: defaultDate || getTodayISO(),
        startTime: '09:00',
        status: 'Pendiente',
      });
    }
  }, [
    isOpen,
    initialData,
    defaultDate,
    clientsList.length,
    unifiedCatalog,
  ]);

  const selectedClientRecord = useMemo(() => {
    if (clientMode !== 'existing') return null;
    return clientsList.find(
      (c) => String(c.id) === String(formData.clientId)
    );
  }, [clientMode, clientsList, formData.clientId]);

  if (!isOpen) return null;

  const toggleCategoryFilter = (cat) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(cat);
      return exists ? prev.filter((c) => c !== cat) : [...prev, cat];
    });
  };

  const toggleCatalogItem = (item) => {
    setSelectedItemKeys((prev) => {
      const exists = prev.includes(item.key);
      const nextKeys = exists
        ? prev.filter((k) => k !== item.key)
        : [...prev, item.key];

      const selectedObjs = unifiedCatalog.filter((u) =>
        nextKeys.includes(u.key)
      );
      const autoSpec = selectedObjs
        .map((s) => `${s.name}: ${s.description}`)
        .join(' | ');

      setFormData((f) => ({
        ...f,
        specification: autoSpec || f.specification,
      }));

      return nextKeys;
    });
    if (fieldErrors.service) {
      setFieldErrors((prev) => ({ ...prev, service: undefined }));
    }
  };

  const handleSlotEmployeeChange = (subKey, empId) => {
    setSlotEmployeeMap((prev) => ({
      ...prev,
      [subKey]: String(empId),
    }));
    if (fieldErrors.schedule) {
      setFieldErrors((prev) => ({ ...prev, schedule: undefined }));
    }
  };

  const handleSelectExistingClient = (clientObj) => {
    setFormData((prev) => ({
      ...prev,
      clientId: String(clientObj.id),
      client: clientObj.name,
      clientPhone: clientObj.phone,
      clientEmail: clientObj.email || '',
    }));
    setFieldErrors((prev) => ({
      ...prev,
      client: undefined,
      clientPhone: undefined,
      clientEmail: undefined,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name] || fieldErrors.schedule) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: undefined,
        schedule: undefined,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.client.trim() || formData.client.trim().length < 3) {
      errors.client = 'Selecciona o ingresa el nombre del cliente.';
    }

    const phoneDigits = formData.clientPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      errors.clientPhone = 'Ingresa un teléfono válido (mínimo 10 dígitos).';
    }

    if (clientMode === 'new' && formData.clientEmail.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.clientEmail.trim())) {
        errors.clientEmail = 'El formato del correo electrónico no es válido.';
      }
    }

    if (scheduledServiceSlots.length === 0) {
      errors.service =
        'Selecciona al menos un servicio o paquete para la cita.';
    }

    if (
      !formData.specification.trim() ||
      formData.specification.trim().length < 5
    ) {
      errors.specification =
        'Escribe la especificación del servicio (mínimo 5 caracteres).';
    }

    // Validar que cada tramo tenga un especialista disponible en su horario acordado
    for (const slot of scheduledServiceSlots) {
      const chosenEmpId = slotEmployeeMap[slot.subKey];
      const chosenEmpObj = slot.candidates.find(
        (c) => String(c.id) === String(chosenEmpId)
      );

      if (!chosenEmpObj) {
        errors.schedule = `Selecciona un especialista para "${slot.name}".`;
        break;
      }

      if (!chosenEmpObj.availability.available) {
        errors.schedule = `En el servicio "${slot.name}" (${slot.startTime}–${slot.endTime}), ${chosenEmpObj.name} no está disponible: ${chosenEmpObj.availability.reason}.`;
        break;
      }
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
    // Construir el desglose detallado de cada tramo con su empleado y horario
    const serviceBreakdown = scheduledServiceSlots.map((slot) => {
      const empId = Number(slotEmployeeMap[slot.subKey]);
      const empObj = employeesList.find((e) => e.id === empId);
      return {
        subKey: slot.subKey,
        serviceName: slot.name,
        category: slot.category,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: slot.durationMinutes,
        employeeId: empId,
        employeeName: empObj?.name || 'Mariana Silva',
        employeeShortName: (empObj?.name || 'Mariana').split(' ')[0],
      };
    });

    const uniqueShortNames = Array.from(
      new Set(serviceBreakdown.map((b) => b.employeeShortName))
    ).join(' + ');

    const uniqueFullNames = Array.from(
      new Set(serviceBreakdown.map((b) => `${b.employeeName} (${b.startTime}–${b.endTime})`))
    ).join(' | ');

    const primaryEmpId = serviceBreakdown[0]?.employeeId || 2;

    const payload = {
      ...formData,
      isNewClient: clientMode === 'new',
      client: formData.client.trim(),
      clientPhone: formData.clientPhone.trim(),
      clientEmail: formData.clientEmail.trim(),
      service: appointmentTotals.combinedServiceNames,
      category: appointmentTotals.primaryCategory,
      categories: appointmentTotals.uniqueCats,
      durationMinutes: appointmentTotals.totalDuration,
      endTime: appointmentTotals.finalEndTime,
      price: appointmentTotals.totalPrice,
      specification: formData.specification.trim(),
      employeeId: primaryEmpId,
      employee: uniqueShortNames,
      employeeFullName: uniqueFullNames,
      serviceBreakdown, // Listo para guardarse en tabla relacional appointment_items en PostgreSQL
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
        className="relative w-full max-w-[740px] bg-white rounded-[32px] shadow-card border border-stone-100 p-7 sm:p-9 animate-in fade-in zoom-in-95 duration-200 max-h-[93vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute flex items-center justify-center w-10 h-10 transition-colors bg-white border top-7 right-7 rounded-2xl border-stone-200/80 text-stone-600 hover:text-brand-primary"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-12 mb-5">
          <span className="block text-xs font-bold tracking-[0.14em] text-brand-primary uppercase mb-1">
            {isEditing ? 'EDITAR CITA' : 'NUEVA CITA EN AGENDA'}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-stone-900">
            {isEditing ? 'Modificar cita' : 'Agendar cita'}
          </h3>
          <p className="text-sm text-stone-400 mt-0.5">
            Selecciona cliente, servicios o paquetes, horario inicial y especialistas por cada servicio.
          </p>
        </div>

        <form onSubmit={handleRequestSubmit} className="space-y-5" noValidate>
          {/* ==================== 1. CLIENTE ==================== */}
          <div className="p-4 rounded-2xl bg-[#FAFAFB] border border-stone-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-stone-800">
                1. Información del Cliente
              </label>
              <div className="inline-flex rounded-xl bg-white p-0.5 border border-stone-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('existing');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    clientMode === 'existing'
                      ? 'bg-brand-primary text-white'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Cliente existente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('new');
                    setFormData((prev) => ({
                      ...prev,
                      clientId: '',
                      client: '',
                      clientPhone: '',
                      clientEmail: '',
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    clientMode === 'new'
                      ? 'bg-brand-primary text-white'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  + Cliente nuevo
                </button>
              </div>
            </div>

            {clientMode === 'existing' ? (
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar cliente por nombre, teléfono o correo electrónico..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                {clientSearch.trim() && (
                  <div className="overflow-y-auto bg-white border divide-y max-h-32 rounded-xl border-stone-200/80 divide-stone-100">
                    {filteredClients.length === 0 ? (
                      <div className="p-3 text-xs text-center text-stone-400">
                        Sin resultados para "{clientSearch}". Usa "+ Cliente nuevo".
                      </div>
                    ) : (
                      filteredClients.map((c) => {
                        const isSelected = String(c.id) === String(formData.clientId);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectExistingClient(c)}
                            className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 text-xs transition-colors ${
                              isSelected
                                ? 'bg-[#FDECEF]/70 text-brand-primary font-bold'
                                : 'hover:bg-surface-bg text-stone-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="block font-bold truncate text-stone-900">
                                {c.name}
                              </span>
                              <span className="block text-[11px] text-stone-400 truncate">
                                Tel: {c.phone} • {c.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isSelected && (
                                <Check className="w-4 h-4 text-brand-primary stroke-[2.5]" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Nombre completo *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="client"
                      value={formData.client}
                      onChange={handleChange}
                      placeholder="Ej. Ana Sofía Vega"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-xs text-stone-800 focus:outline-none ${
                        fieldErrors.client
                          ? 'border-red-400'
                          : 'border-stone-200 focus:border-brand-primary'
                      }`}
                    />
                  </div>
                  {fieldErrors.client && (
                    <p className="text-[10px] font-medium text-red-600 mt-1">
                      {fieldErrors.client}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      placeholder="Ej. 55 1234 5678"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-xs text-stone-800 focus:outline-none ${
                        fieldErrors.clientPhone
                          ? 'border-red-400'
                          : 'border-stone-200 focus:border-brand-primary'
                      }`}
                    />
                  </div>
                  {fieldErrors.clientPhone && (
                    <p className="text-[10px] font-medium text-red-600 mt-1">
                      {fieldErrors.clientPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Correo{' '}
                    <span className="font-normal text-stone-400">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      placeholder="cliente@email.com"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-xs text-stone-800 focus:outline-none ${
                        fieldErrors.clientEmail
                          ? 'border-red-400'
                          : 'border-stone-200 focus:border-brand-primary'
                      }`}
                    />
                  </div>
                  {fieldErrors.clientEmail && (
                    <p className="text-[10px] font-medium text-red-600 mt-1">
                      {fieldErrors.clientEmail}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ==================== 2. SELECCIÓN DE SERVICIOS Y PAQUETES ==================== */}
          <div className="space-y-3">
            {isAdmin && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800">
                    2. Selecciona categoría
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CATEGORIES.map((cat) => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1 border transition-all ${
                          active
                            ? 'bg-[#FDECEF] text-brand-primary border-brand-light'
                            : 'bg-white text-stone-500 border-stone-200'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 stroke-[2.5]" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-stone-800">
                  {isAdmin ? 'Selecciona servicio(s) o paquete(s)' : '2. Servicios y Paquetes disponibles'}
                </span>
                <span className="text-[11px] font-bold text-brand-primary">
                  {scheduledServiceSlots.length} servicio(s) a programar •{' '}
                  {appointmentTotals.totalDuration} min • $
                  {appointmentTotals.totalPrice} MXN
                </span>
              </div>

              <div
                className={`p-3 rounded-2xl bg-[#FAFAFB] border max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 ${
                  fieldErrors.service ? 'border-red-400' : 'border-stone-200/90'
                }`}
              >
                {visibleCatalogItems.map((item) => {
                  const isSelected = selectedItemKeys.includes(item.key);
                  const isPromo = item.type === 'promotion';
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleCatalogItem(item)}
                      className={`p-2.5 rounded-xl text-left flex items-start justify-between gap-2 border transition-all ${
                        isSelected
                          ? 'bg-brand-primary text-white border-brand-primary shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200/90 hover:border-brand-light'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">
                            {item.name}
                          </span>
                        </div>
                        <span
                          className={`block text-[10px] mt-0.5 truncate ${
                            isSelected ? 'text-brand-soft' : 'text-stone-400'
                          }`}
                        >
                          {isPromo
                            ? `Paquete (${item.subServices.length} servicios: ${item.involvedCategories.join(' + ')})`
                            : item.category}{' '}
                          • {item.durationMinutes} min • ${item.price}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.service && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {fieldErrors.service}
                </p>
              )}
            </div>
          </div>

          {/* ==================== 3. FECHA, HORA DE INICIO Y DESGLOSE ENCADENADO DE ESPECIALISTAS POR SERVICIO ==================== */}
          <div className="p-4 rounded-2xl bg-[#FAFAFB] border border-stone-200/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-stone-800">
                3. Horario inicial y asignación de especialistas por servicio
              </label>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDECEF] text-brand-primary">
                Horario total: {formData.startTime} – {appointmentTotals.finalEndTime} hrs
              </span>
            </div>

            {/* Fecha y hora de arranque del primer servicio */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Fecha de la cita
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none focus:border-brand-primary cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Hora de inicio (Servicio 1)
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-brand-primary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

            </div>

            {/* Desglose secuencial: Por cada servicio muestra su horario acordado y los especialistas disponibles */}
            <div className="space-y-2.5 pt-1">
              {scheduledServiceSlots.map((slot, index) => {
                const chosenEmpId = slotEmployeeMap[slot.subKey] || '';
                const chosenEmpObj = slot.candidates.find(
                  (c) => String(c.id) === String(chosenEmpId)
                );

                return (
                  <div key={slot.subKey}>
                    {index > 0 && (
                      <div className="flex items-center justify-center py-0.5 text-stone-400">
                        <ArrowDown className="w-3.5 h-3.5 text-brand-primary" />
                        <span className="text-[10px] font-semibold ml-1 text-stone-400">
                          Continúa inmediatamente a las {slot.startTime} hrs
                        </span>
                      </div>
                    )}

                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {slot.stepIndex}
                          </span>
                          <span className="text-xs font-bold text-stone-900">
                            {slot.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDECEF] text-brand-primary">
                            {slot.category}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-stone-500 mt-1">
                          Horario asignado:{' '}
                          <strong className="text-brand-primary">
                            {slot.startTime} – {slot.endTime} hrs
                          </strong>{' '}
                          ({slot.durationMinutes} min)
                        </p>
                      </div>

                      {/* Selector de empleado disponible para este tramo horario específico */}
                      <div className="sm:w-72 shrink-0">
                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">
                          Especialista disponible ({slot.startTime}–{slot.endTime})
                        </label>
                        <div className="relative">
                          <UserCheck className="w-3.5 h-3.5 text-brand-primary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select
                            value={chosenEmpId}
                            onChange={(e) =>
                              handleSlotEmployeeChange(slot.subKey, e.target.value)
                            }
                            className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer ${
                              chosenEmpObj && !chosenEmpObj.availability.available
                                ? 'bg-red-50/50 border-red-300 text-red-700'
                                : 'bg-[#FAFAFB] border-stone-200 text-stone-800 focus:border-brand-primary'
                            }`}
                          >
                            {slot.candidates.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.availability.available ? '✓ ' : '⚠ '}
                                {emp.name} — {emp.availability.reason}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {fieldErrors.schedule && (
              <div className="flex items-start gap-2 p-3 text-xs font-semibold text-red-700 border border-red-200 rounded-xl bg-red-50">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{fieldErrors.schedule}</span>
              </div>
            )}
          </div>

          {/* Especificación del servicio */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              Especificación del servicio
            </label>
            <textarea
              name="specification"
              rows={2}
              value={formData.specification}
              onChange={handleChange}
              placeholder="Detalla los servicios incluidos, tonos, técnicas o notas para cada especialista..."
              className={`w-full px-4 py-3 rounded-2xl bg-[#FAFAFB] border text-xs text-stone-800 focus:outline-none resize-none ${
                fieldErrors.specification
                  ? 'border-red-400'
                  : 'border-stone-200/90 focus:border-brand-primary'
              }`}
            />
            {fieldErrors.specification && (
              <p className="text-[11px] font-medium text-red-600 mt-1">
                {fieldErrors.specification}
              </p>
            )}
          </div>

          {showSaveConfirm ? (
            <div className="p-4 rounded-2xl bg-[#FDF2F5] border border-brand-light/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-brand-primary text-xs font-bold">
                <ShieldQuestion className="w-5 h-5 shrink-0" />
                <span>
                  ¿Estás seguro de que deseas guardar esta cita con sus horarios y especialistas asignados?
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
                  Sí, confirmar cita
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
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
                {isEditing ? 'Guardar cambios' : 'Agendar cita'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}