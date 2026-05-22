import CustomerPicker from "./CustomerPicker";
import SearchField from "./SearchField";
import SectionTitle from "./SectionTitle";

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
          <button className="primary-button" disabled={saving || !form.customerId} type="submit">
            {editingId ? "Atualizar animal" : "Salvar animal"}
          </button>

          {editingId && (
            <button className="secondary-button" onClick={onCancelEdit} type="button">
              Cancelar edição
            </button>
          )}
        </form>
      </section>

      <section className="list-panel">
        <SectionTitle title="Animais" subtitle="Animais cadastrados por tutor." />
        <SearchField onChange={onSearchChange} placeholder="Buscar animal, raça ou cliente" value={search} />
        <div className="item-list">
          {filteredPets.map((pet) => (
            <article className="item-card" key={pet.id}>
              <div>
                <strong>{pet.name}</strong>
                <span>{pet.breed || "Raça não informada"} • {pet.customer?.name}</span>
              </div>
              <div className="item-meta">
                <button onClick={() => onView(pet)} type="button">
                  Visualizar
                </button>
                <button onClick={() => onEdit(pet)} type="button">
                  Editar
                </button>
                <button onClick={() => onDelete(pet.id, pet.name)} type="button">
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {!filteredPets.length && <p className="empty-state">Nenhum animal encontrado.</p>}
        </div>
      </section>
    </div>
  );
}

export default PetsView;
