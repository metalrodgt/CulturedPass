import logo from '../../assets/logo.jpg';

export default function LogoCirculo({ tam = 56, className = '' }) {
  return (
    <img
      src={logo}
      alt="Logo de CulturedPass"
      className={`logo-circulo ${className}`}
      style={{ width: tam, height: tam }}
    />
  );
}
