import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const role = user?.role || localStorage.getItem("role");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  /* 🎨 ROLE-BASED THEME */
  const theme =
    role === "mentor"
      ? {
          bg: "bg-emerald-50 border-emerald-200",
          text: "text-emerald-900",
          subtext: "text-emerald-600",
          button:
            "text-emerald-700 hover:bg-emerald-100 border-emerald-300",
        }
      : {
          bg: "bg-indigo-50 border-indigo-200",
          text: "text-indigo-900",
          subtext: "text-indigo-600",
          button:
            "text-indigo-700 hover:bg-indigo-100 border-indigo-300",
        };

  return (
    <header
      className={`flex justify-between items-center px-6 py-3 border-b ${theme.bg}`}
    >
      {/* LEFT: Greeting */}
      <div>
        <h1 className={`font-semibold text-lg ${theme.text}`}>
          Welcome, {user?.full_name || "Guest"}
        </h1>

      </div>

      {/* RIGHT: Logout */}
      <button
        onClick={handleLogout}
        className={`text-sm font-semibold px-3 py-1 border rounded transition ${theme.button}`}
      >
        Logout
      </button>
    </header>
  );
};

export default Navbar;
