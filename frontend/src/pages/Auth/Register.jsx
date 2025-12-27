import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student", // 👈 NEW
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await axios.post("http://localhost:8000/api/auth/register", form);
      setMessage("✅ Registration successful! Redirecting to login...");
      setForm({ full_name: "", email: "", password: "", role: "student" });

      setTimeout(() => {
        navigate("/login", {
          state: { successMessage: "Registration successful. Please login." },
        });
      }, 2000);
    } catch (err) {
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map((d) => d.msg).join(", "));
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError("❌ Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create an Account</h2>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          {/* 👇 NEW ROLE SELECT */}
          <div style={styles.field}>
            <label style={styles.label}>Register As</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>

          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

// -------------------- Styles --------------------
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "30px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0px 8px 24px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
    fontSize: "24px",
    fontWeight: "600",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  field: {
    marginBottom: "15px",
    textAlign: "left",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    background: "#6B73FF",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  success: {
    color: "green",
    fontSize: "14px",
    marginBottom: "10px",
  },
  error: {
    color: "red",
    fontSize: "14px",
    marginBottom: "10px",
  },
  footer: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#555",
  },
  link: {
    color: "#6B73FF",
    fontWeight: "600",
    textDecoration: "none",
  },
};

export default Register;
