import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import SummaryGrid from "./SummaryGrid";
import AppointmentsView from "./AppointmentsView";
import CustomersView from "./CustomersView";
import PetsView from "./PetsView";
import DetailsModal from "./DetailsModal";
import ConfirmModal from "./ConfirmModal";
import {
  API_URL,
  emptyAppointment,
  emptyCustomer,
  emptyPet,
  serviceLabels,
  statusLabels,
} from "../constants";
import {
  formatDate,
  formatMoney,
  maskMoney,
  maskPhone,
  normalizeText,
  parseMoney,
  toDateInputValue,
} from "../utils";

function DashboardApp({ onLogout }) {
  const [activeTab, setActiveTab] = useState("appointments");
  const [customers, setCustomers] = useState([]);
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [petForm, setPetForm] = useState(emptyPet);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [petSearch, setPetSearch] = useState("");
  const [editingCustomerId, setEditingCustomerId] = useState("");
  const [editingPetId, setEditingPetId] = useState("");
  const [editingAppointmentId, setEditingAppointmentId] = useState("");
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const petsBySelectedCustomer = useMemo(() => {
    if (!appointmentForm.customerId) return pets;
    return pets.filter((pet) => pet.customerId === appointmentForm.customerId);
  }, [appointmentForm.customerId, pets]);

  const monthlyRevenue = useMemo(
    () =>
      appointments
        .filter((item) => item.status !== "CANCELED")
        .reduce((total, item) => total + Number(item.price), 0),
    [appointments],
  );

  const filteredAppointments = useMemo(() => {
    const search = normalizeText(appointmentSearch);

    return appointments.filter((appointment) => {
      const text = normalizeText(
        `${appointment.customer?.name ?? ""} ${appointment.pet?.name ?? ""}`,
      );

      return !search || text.includes(search);
    });
  }, [appointmentSearch, appointments]);

  const filteredCustomers = useMemo(() => {
    const search = normalizeText(customerSearch);

    return customers.filter((customer) => {
      const text = normalizeText(`${customer.name} ${customer.phone}`);
      return !search || text.includes(search);
    });
  }, [customerSearch, customers]);

  const filteredPets = useMemo(() => {
    const search = normalizeText(petSearch);

    return pets.filter((pet) => {
      const text = normalizeText(
        `${pet.name} ${pet.breed ?? ""} ${pet.customer?.name ?? ""}`,
      );
      return !search || text.includes(search);
    });
  }, [petSearch, pets]);

  const request = useCallback(async (path, options) => {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message ?? "Não foi possível concluir a ação.");
    }

    return response.json();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [customersData, petsData, appointmentsData] = await Promise.all([
        request("/customers"),
        request("/pets"),
        request("/appointments"),
      ]);

      setCustomers(customersData);
      setPets(petsData);
      setAppointments(appointmentsData);
      setMessage("");
    } catch (error) {
      setMessage(
        `${error.message} Verifique se o backend está rodando em ${API_URL}.`,
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  function updateCustomerForm(field, value) {
    setCustomerForm((current) => ({
      ...current,
      [field]: field === "phone" ? maskPhone(value) : value,
    }));
  }

  function updatePetForm(field, value) {
    setPetForm((current) => ({ ...current, [field]: value }));
  }

  function updateAppointmentForm(field, value) {
    setAppointmentForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "customerId") {
        next.petId = "";
      }

      return next;
    });
  }

  function handleEditCustomer(customer) {
    setCustomerForm({
      name: customer.name,
      phone: maskPhone(customer.phone),
    });
    setEditingCustomerId(customer.id);
  }

  function handleCancelCustomerEdit() {
    setCustomerForm(emptyCustomer);
    setEditingCustomerId("");
  }

  function handleEditPet(pet) {
    setPetForm({
      name: pet.name,
      breed: pet.breed ?? "",
      customerId: pet.customerId,
    });
    setEditingPetId(pet.id);
  }

  function handleCancelPetEdit() {
    setPetForm(emptyPet);
    setEditingPetId("");
  }

  function handleEditAppointment(appointment) {
    setAppointmentForm({
      customerId: appointment.customerId,
      petId: appointment.petId,
      serviceType: appointment.serviceType,
      status: appointment.status,
      price: formatMoney(appointment.price),
      serviceDate: toDateInputValue(appointment.serviceDate),
      notes: appointment.notes ?? "",
    });
    setEditingAppointmentId(appointment.id);
  }

  function handleCancelAppointmentEdit() {
    setAppointmentForm(emptyAppointment);
    setEditingAppointmentId("");
  }

  async function handleSubmitCustomer(event) {
    event.preventDefault();

    await save(async () => {
      await request(
        editingCustomerId ? `/customers/${editingCustomerId}` : "/customers",
        {
          method: editingCustomerId ? "PATCH" : "POST",
          body: JSON.stringify(customerForm),
        },
      );
      setCustomerForm(emptyCustomer);
      setEditingCustomerId("");
      setActiveTab("pets");
    });
  }

  async function handleSubmitPet(event) {
    event.preventDefault();

    await save(async () => {
      await request(editingPetId ? `/pets/${editingPetId}` : "/pets", {
        method: editingPetId ? "PATCH" : "POST",
        body: JSON.stringify(petForm),
      });
      setPetForm(emptyPet);
      setEditingPetId("");
      setActiveTab("appointments");
    });
  }

  async function handleSubmitAppointment(event) {
    event.preventDefault();

    await save(async () => {
      await request(
        editingAppointmentId
          ? `/appointments/${editingAppointmentId}`
          : "/appointments",
        {
          method: editingAppointmentId ? "PATCH" : "POST",
          body: JSON.stringify({
            ...appointmentForm,
            price: parseMoney(appointmentForm.price),
          }),
        },
      );
      setAppointmentForm(emptyAppointment);
      setEditingAppointmentId("");
    });
  }

  async function handleDelete(resource, id) {
    await save(async () => {
      await request(`/${resource}/${id}`, { method: "DELETE" });

      if (resource === "customers" && editingCustomerId === id) {
        handleCancelCustomerEdit();
      }

      if (resource === "pets" && editingPetId === id) {
        handleCancelPetEdit();
      }

      if (resource === "appointments" && editingAppointmentId === id) {
        handleCancelAppointmentEdit();
      }
    });
  }

  function requestDelete(resource, id, label) {
    setDeleteTarget({ resource, id, label });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const { resource, id } = deleteTarget;
    await handleDelete(resource, id);
    setDeleteTarget(null);
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  async function save(action) {
    try {
      setSaving(true);
      await action();
      await loadData();
      setMessage("Pronto. Informações atualizadas.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <section className="content">
        <Topbar onRefresh={loadData} onLogout={onLogout} />
        {message && <p className="status-message">{message}</p>}
        <SummaryGrid
          customers={customers.length}
          pets={pets.length}
          appointments={appointments.length}
          revenue={formatMoney(monthlyRevenue)}
        />

        {loading ? (
          <div className="empty-state">Carregando informações...</div>
        ) : (
          <>
            {activeTab === "appointments" && (
              <AppointmentsView
                customers={customers}
                editingId={editingAppointmentId}
                filteredAppointments={filteredAppointments}
                form={appointmentForm}
                onCancelEdit={handleCancelAppointmentEdit}
                onChange={updateAppointmentForm}
                onDelete={(id, label) => requestDelete("appointments", id, label)}
                onEdit={handleEditAppointment}
                onSearchChange={setAppointmentSearch}
                onSubmit={handleSubmitAppointment}
                onView={(appointment) =>
                  setViewingRecord({ type: "appointment", data: appointment })
                }
                pets={petsBySelectedCustomer}
                search={appointmentSearch}
                saving={saving}
              />
            )}

            {activeTab === "customers" && (
              <CustomersView
                editingId={editingCustomerId}
                filteredCustomers={filteredCustomers}
                form={customerForm}
                onCancelEdit={handleCancelCustomerEdit}
                onChange={updateCustomerForm}
                onDelete={(id, label) => requestDelete("customers", id, label)}
                onEdit={handleEditCustomer}
                onSearchChange={setCustomerSearch}
                onSubmit={handleSubmitCustomer}
                onView={(customer) =>
                  setViewingRecord({ type: "customer", data: customer })
                }
                search={customerSearch}
                saving={saving}
              />
            )}

            {activeTab === "pets" && (
              <PetsView
                customers={customers}
                editingId={editingPetId}
                filteredPets={filteredPets}
                form={petForm}
                onCancelEdit={handleCancelPetEdit}
                onChange={updatePetForm}
                onDelete={(id, label) => requestDelete("pets", id, label)}
                onEdit={handleEditPet}
                onSearchChange={setPetSearch}
                onSubmit={handleSubmitPet}
                onView={(pet) => setViewingRecord({ type: "pet", data: pet })}
                search={petSearch}
                saving={saving}
              />
            )}
          </>
        )}
      </section>

      {viewingRecord && (
        <DetailsModal
          appointments={appointments}
          onClose={() => setViewingRecord(null)}
          record={viewingRecord}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Excluir registro"
          message={`Tem certeza que deseja excluir ${deleteTarget.label || "este registro"}? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </main>
  );
}

export default DashboardApp;
