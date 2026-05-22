function SearchField({ onChange, placeholder, value }) {
  return (
    <label className="search-panel">
      Pesquisar
      <input
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

export default SearchField;
