function SummaryGrid({ customers, pets, appointments, revenue }) {
  return (
    <section className="summary-grid" aria-label="Resumo">
      <article>
        <span>Clientes</span>
        <strong>{customers}</strong>
      </article>
      <article>
        <span>Animais</span>
        <strong>{pets}</strong>
      </article>
      <article>
        <span>Atendimentos</span>
        <strong>{appointments}</strong>
      </article>
      <article>
        <span>Faturamento</span>
        <strong>{revenue}</strong>
      </article>
    </section>
  );
}

export default SummaryGrid;
