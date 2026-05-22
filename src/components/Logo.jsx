import logoSrc from "../assets/LogoPetShopDM.png";

function Logo({ className = "", alt = "Logo PetShop DM" }) {
  return (
    <div className={className}>
      <img src={logoSrc} alt={alt} />
    </div>
  );
}

export default Logo;
