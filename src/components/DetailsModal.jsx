import { useMemo } from "react";
import { serviceLabels, statusLabels } from "../constants";
import { formatDate, formatMoney } from "../utils";

function DetailsModal({ appointments, onClose, record }) {
  const { data, type } = record;

  const title = {
    appointment: "Detalhes do atendimento",
    customer: "Detalhes do cliente",
    pet: "Detalhes do animal",
  }[type];

  const relatedAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        if (type === "customer") return appointment.customerId === data.id;
        if (type === "pet") return appointment.petId === data.id;
        return appointment.id === data.id;
      }),
    [appointments, data.id, type],
  );

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
                      {serviceLabels[appointment.serviceType]} • {statusLabels[appointment.status]}
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

export default DetailsModal;
