import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <button
        type="button"
        className="button primary"
        onClick={() => navigate("/login")}
      >
        Log In
      </button>
    </nav>
  );
}
