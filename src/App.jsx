import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const serviceLabels = {
  BANHO: "Banho",
  TOSA: "Tosa",
  BANHO_E_TOSA: "Banho + Tosa",
};

const statusLabels = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

const today = new Date().toISOString().slice(0, 10);

const emptyCustomer = { name: "", phone: "" };
const emptyPet = { name: "", breed: "", customerId: "" };
const emptyAppointment = {
  customerId: "",
  petId: "",
  serviceType: "BANHO",
  status: "SCHEDULED",
  price: "",
  serviceDate: today,
  notes: "",
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return <DashboardApp onLogout={() => setIsLoggedIn(false)} />;
}

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
      <aside className="sidebar">
        <div className="brand">
          <div className="logo-slot">Logo</div>
          <div>
            <strong>PetShop DM</strong>
            <span>Dona Marlene</span>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Módulos do sistema">
          <button
            className={activeTab === "appointments" ? "active" : ""}
            onClick={() => setActiveTab("appointments")}
            type="button"
          >
            Atendimentos
          </button>
          <button
            className={activeTab === "customers" ? "active" : ""}
            onClick={() => setActiveTab("customers")}
            type="button"
          >
            Clientes
          </button>
          <button
            className={activeTab === "pets" ? "active" : ""}
            onClick={() => setActiveTab("pets")}
            type="button"
          >
            Animais
          </button>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sistema de gestão</p>
            <h1>Atendimentos do petshop</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={loadData} type="button">
              Atualizar
            </button>
            <button className="ghost-button" onClick={onLogout} type="button">
              Sair
            </button>
          </div>
        </header>

        {message && <p className="status-message">{message}</p>}

        <section className="summary-grid" aria-label="Resumo">
          <article>
            <span>Clientes</span>
            <strong>{customers.length}</strong>
          </article>
          <article>
            <span>Animais</span>
            <strong>{pets.length}</strong>
          </article>
          <article>
            <span>Atendimentos</span>
            <strong>{appointments.length}</strong>
          </article>
          <article>
            <span>Faturamento</span>
            <strong>{formatMoney(monthlyRevenue)}</strong>
          </article>
        </section>

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
                onDelete={(id) => handleDelete("appointments", id)}
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
                onDelete={(id) => handleDelete("customers", id)}
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
                onDelete={(id) => handleDelete("pets", id)}
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
    </main>
  );
}

function LoginScreen({ onLogin }) {
  function handleSubmit(event) {
    event.preventDefault();
    onLogin();
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">Logo</div>
        <p className="eyebrow">PetShop DM</p>
        <h1>Bem-vinda de volta</h1>
        <p className="login-copy">
          Acesse os clientes, animais e atendimentos do dia em poucos cliques.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Usuária
            <input disabled value="Dona Marlene" />
          </label>
          <button className="primary-button" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}

function AppointmentsView({
  customers,
  editingId,
  filteredAppointments,
  form,
  onCancelEdit,
  onChange,
  onDelete,
  onEdit,
  onSearchChange,
  onSubmit,
  onView,
  pets,
  search,
  saving,
}) {
  return (
    <div className="workspace">
      <section className="form-panel">
        <SectionTitle
          title={editingId ? "Editar atendimento" : "Novo atendimento"}
          subtitle={
            editingId
              ? "Atualize as informações do atendimento selecionado."
              : "Registre banho, tosa ou banho com tosa."
          }
        />

        <form onSubmit={onSubmit}>
          <CustomerPicker
            customers={customers}
            label="Cliente"
            onChange={(value) => onChange("customerId", value)}
            value={form.customerId}
          />

          <label>
            Animal
            <select
              disabled={!form.customerId}
              onChange={(event) => onChange("petId", event.target.value)}
              required
              value={form.petId}
            >
              <option value="">Selecione</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </label>

          <div className="field-row">
            <label>
              Serviço
              <select
                onChange={(event) =>
                  onChange("serviceType", event.target.value)
                }
                value={form.serviceType}
              >
                {Object.entries(serviceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                onChange={(event) => onChange("status", event.target.value)}
                value={form.status}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-row">
            <label>
              Data
              <input
                onChange={(event) =>
                  onChange("serviceDate", event.target.value)
                }
                required
                type="date"
                value={form.serviceDate}
              />
            </label>
            <label>
              Valor
              <input
                inputMode="numeric"
                onChange={(event) =>
                  onChange("price", maskMoney(event.target.value))
                }
                placeholder="R$ 80,00"
                required
                value={form.price}
              />
            </label>
          </div>

          <label>
            Observação
            <textarea
              onChange={(event) => onChange("notes", event.target.value)}
              placeholder="Ex.: usar shampoo antialérgico"
              value={form.notes}
            />
          </label>

          <button
            className="primary-button"
            disabled={saving || !form.customerId || !form.petId || !form.price}
            type="submit"
          >
            {editingId ? "Atualizar atendimento" : "Salvar atendimento"}
          </button>

          {editingId && (
            <button
              className="secondary-button"
              onClick={onCancelEdit}
              type="button"
            >
              Cancelar edição
            </button>
          )}
        </form>
      </section>

      <section className="list-panel">
        <SectionTitle
          title="Atendimentos"
          subtitle="Pesquise por cliente ou animal."
        />

        <SearchField
          onChange={onSearchChange}
          placeholder="Buscar por cliente ou animal"
          value={search}
        />

        <div className="item-list">
          {filteredAppointments.map((appointment) => (
            <article className="item-card" key={appointment.id}>
              <div>
                <strong>{appointment.pet?.name ?? "Animal"}</strong>
                <span>
                  {appointment.customer?.name} •{" "}
                  {serviceLabels[appointment.serviceType]}
                </span>
              </div>
              <div className="item-meta">
                <span>{formatDate(appointment.serviceDate)}</span>
                <span>{formatMoney(appointment.price)}</span>
                <button onClick={() => onView(appointment)} type="button">
                  Visualizar
                </button>
                <button onClick={() => onEdit(appointment)} type="button">
                  Editar
                </button>
                <button onClick={() => onDelete(appointment.id)} type="button">
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {!filteredAppointments.length && (
            <p className="empty-state">Nenhum atendimento encontrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function CustomersView({
  editingId,
  filteredCustomers,
  form,
  onCancelEdit,
  onChange,
  onDelete,
  onEdit,
  onSearchChange,
  onSubmit,
  onView,
  search,
  saving,
}) {
  return (
    <div className="workspace">
      <section className="form-panel">
        <SectionTitle
          title={editingId ? "Editar cliente" : "Novo cliente"}
          subtitle={
            editingId
              ? "Atualize nome ou telefone do cliente."
              : "Cadastre nome e telefone para encontrar rápido depois."
          }
        />

        <form onSubmit={onSubmit}>
          <label>
            Nome
            <input
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Nome do cliente"
              required
              value={form.name}
            />
          </label>
          <label>
            Telefone
            <input
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder="(00) 00000-0000"
              required
              inputMode="numeric"
              value={form.phone}
            />
          </label>
          <button className="primary-button" disabled={saving} type="submit">
            {editingId ? "Atualizar cliente" : "Salvar cliente"}
          </button>

          {editingId && (
            <button
              className="secondary-button"
              onClick={onCancelEdit}
              type="button"
            >
              Cancelar edição
            </button>
          )}
        </form>
      </section>

      <section className="list-panel">
        <SectionTitle title="Clientes" subtitle="Base cadastrada no sistema." />
        <SearchField
          onChange={onSearchChange}
          placeholder="Buscar por cliente ou telefone"
          value={search}
        />
        <div className="item-list">
          {filteredCustomers.map((customer) => (
            <article className="item-card" key={customer.id}>
              <div>
                <strong>{customer.name}</strong>
                <span>{customer.phone}</span>
              </div>
              <div className="item-meta">
                <span>{customer.pets?.length ?? 0} animal(is)</span>
                <button onClick={() => onView(customer)} type="button">
                  Visualizar
                </button>
                <button onClick={() => onEdit(customer)} type="button">
                  Editar
                </button>
                <button onClick={() => onDelete(customer.id)} type="button">
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {!filteredCustomers.length && (
            <p className="empty-state">Nenhum cliente encontrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function PetsView({
  customers,
  editingId,
  filteredPets,
  form,
  onCancelEdit,
  onChange,
  onDelete,
  onEdit,
  onSearchChange,
  onSubmit,
  onView,
  search,
  saving,
}) {
  return (
    <div className="workspace">
      <section className="form-panel">
        <SectionTitle
          title={editingId ? "Editar animal" : "Novo animal"}
          subtitle={
            editingId
              ? "Atualize o cadastro do animal."
              : "Vincule o animal ao cliente responsável."
          }
        />

        <form onSubmit={onSubmit}>
          <label>
            Nome
            <input
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Nome do animal"
              required
              value={form.name}
            />
          </label>
          <label>
            Raça
            <input
              onChange={(event) => onChange("breed", event.target.value)}
              placeholder="Ex.: Shih-tzu"
              value={form.breed}
            />
          </label>
          <CustomerPicker
            customers={customers}
            label="Cliente"
            onChange={(value) => onChange("customerId", value)}
            value={form.customerId}
          />
          <button
            className="primary-button"
            disabled={saving || !form.customerId}
            type="submit"
          >
            {editingId ? "Atualizar animal" : "Salvar animal"}
          </button>

          {editingId && (
            <button
              className="secondary-button"
              onClick={onCancelEdit}
              type="button"
            >
              Cancelar edição
            </button>
          )}
        </form>
      </section>

      <section className="list-panel">
        <SectionTitle
          title="Animais"
          subtitle="Animais cadastrados por tutor."
        />
        <SearchField
          onChange={onSearchChange}
          placeholder="Buscar animal, raça ou cliente"
          value={search}
        />
        <div className="item-list">
          {filteredPets.map((pet) => (
            <article className="item-card" key={pet.id}>
              <div>
                <strong>{pet.name}</strong>
                <span>
                  {pet.breed || "Raça não informada"} • {pet.customer?.name}
                </span>
              </div>
              <div className="item-meta">
                <button onClick={() => onView(pet)} type="button">
                  Visualizar
                </button>
                <button onClick={() => onEdit(pet)} type="button">
                  Editar
                </button>
                <button onClick={() => onDelete(pet.id)} type="button">
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {!filteredPets.length && (
            <p className="empty-state">Nenhum animal encontrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SearchField({ onChange, placeholder, value }) {
  return (
    <label className="search-panel">
      Pesquisar
      <input
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function DetailsModal({ appointments, onClose, record }) {
  const { data, type } = record;

  const title = {
    appointment: "Detalhes do atendimento",
    customer: "Detalhes do cliente",
    pet: "Detalhes do animal",
  }[type];

  const relatedAppointments = appointments.filter((appointment) => {
    if (type === "customer") return appointment.customerId === data.id;
    if (type === "pet") return appointment.petId === data.id;
    return appointment.id === data.id;
  });

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="details-title"
        aria-modal="true"
        className="details-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Visualização</p>
            <h2 id="details-title">{title}</h2>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Fechar
          </button>
        </header>

        {type === "appointment" && (
          <dl className="details-grid">
            <Detail label="Cliente" value={data.customer?.name} />
            <Detail label="Animal" value={data.pet?.name} />
            <Detail label="Serviço" value={serviceLabels[data.serviceType]} />
            <Detail label="Status" value={statusLabels[data.status]} />
            <Detail label="Data" value={formatDate(data.serviceDate)} />
            <Detail label="Valor" value={formatMoney(data.price)} />
            <Detail
              label="Observação"
              value={data.notes || "Sem observação"}
              wide
            />
          </dl>
        )}

        {type === "customer" && (
          <dl className="details-grid">
            <Detail label="Nome" value={data.name} />
            <Detail label="Telefone" value={data.phone} />
            <Detail label="Animais" value={data.pets?.length ?? 0} />
            <Detail label="Atendimentos" value={relatedAppointments.length} />
          </dl>
        )}

        {type === "pet" && (
          <dl className="details-grid">
            <Detail label="Nome" value={data.name} />
            <Detail label="Raça" value={data.breed || "Não informada"} />
            <Detail label="Cliente" value={data.customer?.name} />
            <Detail label="Atendimentos" value={relatedAppointments.length} />
          </dl>
        )}

        {!!relatedAppointments.length && (
          <div className="modal-history">
            <h3>Atendimentos vinculados</h3>
            <div className="item-list">
              {relatedAppointments.slice(0, 5).map((appointment) => (
                <article className="item-card" key={appointment.id}>
                  <div>
                    <strong>{appointment.pet?.name ?? data.name}</strong>
                    <span>
                      {serviceLabels[appointment.serviceType]} •{" "}
                      {statusLabels[appointment.status]}
                    </span>
                  </div>
                  <div className="item-meta">
                    <span>{formatDate(appointment.serviceDate)}</span>
                    <span>{formatMoney(appointment.price)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value, wide = false }) {
  return (
    <div className={wide ? "detail-item detail-item-wide" : "detail-item"}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CustomerPicker({ customers, label, onChange, value }) {
  const selectedCustomer = customers.find((customer) => customer.id === value);
  const [pickerState, setPickerState] = useState({
    query: "",
    value: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const query =
    pickerState.value === value
      ? pickerState.query
      : (selectedCustomer?.name ?? "");

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return customers
      .filter((customer) => {
        if (!normalizedQuery) return true;

        return normalizeText(`${customer.name} ${customer.phone}`).includes(
          normalizedQuery,
        );
      })
      .slice(0, 6);
  }, [customers, query]);

  function selectCustomer(customer) {
    onChange(customer.id);
    setPickerState({ query: customer.name, value: customer.id });
    setIsOpen(false);
  }

  function handleChange(event) {
    const nextValue = value ? "" : value;

    setPickerState({ query: event.target.value, value: nextValue });
    setIsOpen(true);

    if (value) {
      onChange("");
    }
  }

  return (
    <label className="customer-picker">
      {label}
      <input
        autoComplete="off"
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        placeholder="Pesquisar cliente"
        value={query}
      />

      {isOpen && (
        <div className="picker-list">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectCustomer(customer)}
              type="button"
            >
              <strong>{customer.name}</strong>
              <span>{customer.phone}</span>
            </button>
          ))}

          {!filteredCustomers.length && (
            <p>Nenhum cliente encontrado nos primeiros resultados.</p>
          )}
        </div>
      )}
    </label>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function maskMoney(value) {
  const digits = value.replace(/\D/g, "");
  const amount = Number(digits || 0) / 100;

  if (!digits) return "";

  return formatMoney(amount);
}

function parseMoney(value) {
  const digits = value.replace(/\D/g, "");
  return Number(digits || 0) / 100;
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toDateInputValue(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value) || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

export default App;
