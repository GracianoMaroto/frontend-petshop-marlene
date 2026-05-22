import CustomerPicker from "./CustomerPicker";
import SearchField from "./SearchField";
import SectionTitle from "./SectionTitle";
import { formatDate, formatMoney, maskMoney } from "../utils";
import { serviceLabels, statusLabels } from "../constants";

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
                onChange={(event) => onChange("serviceType", event.target.value)}
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
                onChange={(event) => onChange("serviceDate", event.target.value)}
                required
                type="date"
                value={form.serviceDate}
              />
            </label>
            <label>
              Valor
              <input
                inputMode="numeric"
                onChange={(event) => onChange("price", maskMoney(event.target.value))}
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

          <button className="primary-button" disabled={saving || !form.customerId || !form.petId || !form.price} type="submit">
            {editingId ? "Atualizar atendimento" : "Salvar atendimento"}
          </button>

          {editingId && (
            <button className="secondary-button" onClick={onCancelEdit} type="button">
              Cancelar edição
            </button>
          )}
        </form>
      </section>

      <section className="list-panel">
        <SectionTitle title="Atendimentos" subtitle="Pesquise por cliente ou animal." />

        <SearchField onChange={onSearchChange} placeholder="Buscar por cliente ou animal" value={search} />

        <div className="item-list">
          {filteredAppointments.map((appointment) => (
            <article className="item-card" key={appointment.id}>
              <div>
                <strong>{appointment.pet?.name ?? "Animal"}</strong>
                <span>
                  {appointment.customer?.name} • {serviceLabels[appointment.serviceType]}
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
                <button
                  onClick={() =>
                    onDelete(
                      appointment.id,
                      `${appointment.pet?.name ?? "atendimento"}`,
                    )
                  }
                  type="button"
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {!filteredAppointments.length && <p className="empty-state">Nenhum atendimento encontrado.</p>}
        </div>
      </section>
    </div>
  );
}

export default AppointmentsView;
