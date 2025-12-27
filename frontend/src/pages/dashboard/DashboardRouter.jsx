import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import StudentDashboard from "./StudentDashboard";
import MentorDashboard from "./MentorDashboard";

const DashboardRouter = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) {
      navigate("/login", { replace: true });
    }
  }, [token, user, navigate]);

  // ⛔ Prevent render during redirect
  if (!token || !user) return null;

  // ✅ Role-based routing
  if (user.role === "mentor") {
    return <MentorDashboard />;
  }

  return <StudentDashboard />;
};

export default DashboardRouter;
