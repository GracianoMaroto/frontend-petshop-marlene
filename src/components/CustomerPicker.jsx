import { useMemo, useState } from "react";

function CustomerPicker({ customers, label, onChange, value }) {
  const selectedCustomer = customers.find((customer) => customer.id === value);
  const [pickerState, setPickerState] = useState({ query: "", value: "" });
  const [isOpen, setIsOpen] = useState(false);

  const query =
    pickerState.value === value ? pickerState.query : selectedCustomer?.name ?? "";

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return customers
      .filter((customer) => {
        if (!normalizedQuery) return true;

        return `${customer.name} ${customer.phone}`
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(normalizedQuery);
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

export default CustomerPicker;
