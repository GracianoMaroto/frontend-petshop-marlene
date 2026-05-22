import Logo from "./Logo";

function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo className="logo-slot" />
        <div>
          <strong>PetShop DM</strong>
          <span>Dona Marlene</span>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Módulos do sistema">
        <button
          className={activeTab === "appointments" ? "active" : ""}
          onClick={() => onTabChange("appointments")}
          type="button"
        >
          Atendimentos
        </button>
        <button
          className={activeTab === "customers" ? "active" : ""}
          onClick={() => onTabChange("customers")}
          type="button"
        >
          Clientes
        </button>
        <button
          className={activeTab === "pets" ? "active" : ""}
          onClick={() => onTabChange("pets")}
          type="button"
        >
          Animais
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
