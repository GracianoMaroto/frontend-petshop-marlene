import SearchField from "./SearchField";
import SectionTitle from "./SectionTitle";
import { formatMoney } from "../utils";

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
            <button className="secondary-button" onClick={onCancelEdit} type="button">
              Cancelar edição
            </button>
          )}
        </form>
      </section>

      <section className="list-panel">
        <SectionTitle title="Clientes" subtitle="Base cadastrada no sistema." />
        <SearchField onChange={onSearchChange} placeholder="Buscar por cliente ou telefone" value={search} />
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
                <button onClick={() => onDelete(customer.id, customer.name)} type="button">
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {!filteredCustomers.length && <p className="empty-state">Nenhum cliente encontrado.</p>}
        </div>
      </section>
    </div>
  );
}

export default CustomersView;
