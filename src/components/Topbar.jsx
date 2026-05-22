function Topbar({ onRefresh, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Sistema de gestão</p>
        <h1>Atendimentos do petshop</h1>
      </div>
      <div className="topbar-actions">
        <button className="ghost-button" onClick={onRefresh} type="button">
          Atualizar
        </button>
        <button className="ghost-button" onClick={onLogout} type="button">
          Sair
        </button>
      </div>
    </header>
  );
}

export default Topbar;
