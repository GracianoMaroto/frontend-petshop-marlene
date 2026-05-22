export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const serviceLabels = {
  BANHO: "Banho",
  TOSA: "Tosa",
  BANHO_E_TOSA: "Banho + Tosa",
};

export const statusLabels = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

export const today = new Date().toISOString().slice(0, 10);

export const emptyCustomer = { name: "", phone: "" };
export const emptyPet = { name: "", breed: "", customerId: "" };
export const emptyAppointment = {
  customerId: "",
  petId: "",
  serviceType: "BANHO",
  status: "SCHEDULED",
  price: "",
  serviceDate: today,
  notes: "",
};
