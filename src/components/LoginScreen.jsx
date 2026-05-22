import Logo from "./Logo";

function LoginScreen({ onLogin }) {
  function handleSubmit(event) {
    event.preventDefault();
    onLogin();
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Logo className="login-logo" />
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

export default LoginScreen;
