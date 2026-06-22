import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      {/* Logo */}
      <button className="navbar-logo" onClick={() => navigate("/")}>
        <span className="navbar-logo__icon" aria-hidden="true">⚽</span>
        <span className="navbar-logo__text">
          WorldCup<span className="navbar-logo__accent"> AI</span>
        </span>
      </button>

      {/* Centre nav link */}
      <button
        className={`navbar-link${pathname === "/about" ? " navbar-link--active" : ""}`}
        onClick={() => navigate("/about")}
      >
        About
      </button>

      {/* Actions */}
      <div className="navbar-actions">
        {pathname === "/profile" ? (
          <button className="navbar-btn" onClick={() => navigate("/")}>
            ← Home
          </button>
        ) : (
          <button className="navbar-btn" onClick={() => navigate("/profile")}>
            My Profile
          </button>
        )}
        <button className="navbar-btn navbar-btn--danger" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
