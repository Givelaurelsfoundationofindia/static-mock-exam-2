import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { BrandingContext } from "../context/BrandingContext";
import logoGtst from "../assets/logos/logo-gtst.png";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { MOCK_STUDENTS } from "../mock/mockExamBackend";

const Landing = () => {
  const { login, loading, sessionError } = useContext(AuthContext);
  const { examName, logoUrl } = useContext(BrandingContext);
  const navigate = useNavigate();
  const [aadharNumber, setAadharNumber] = useState("5432 1098 7654");
  const [dateOfBirth, setDateOfBirth] = useState("2013-08-15");
  const [error, setError] = useState("");

  const formatAadharInput = (value) => {
    const raw = value.replace(/\D/g, "").slice(0, 12);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.slice(i, i + 4));
    }
    return parts.join(" ");
  };

  const handleAadharChange = (e) => {
    const formatted = formatAadharInput(e.target.value);
    setAadharNumber(formatted);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    const result = await login({ aadharNumber, dateOfBirth });
    if (result.success) {
      navigate("/student-confirm", { replace: true });
    } else {
      setError(result.message);
    }
  };

  const handleQuickLogin = async (student) => {
    const aadhar = student.aadharNumber || "5432 1098 7654";
    const dob = student.dateOfBirth || "2013-08-15";
    setAadharNumber(aadhar);
    setDateOfBirth(dob);
    setError("");
    const result = await login({
      aadharNumber: aadhar,
      dateOfBirth: dob,
    });
    if (result.success) {
      navigate("/student-confirm", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      <Header />
      <main className="landing-main">
        <div className="landing-login-wrap">
          <div className="card login-card login-card-large">
            <div className="login-head">
              <div className="login-brand-row">
                <img
                  src={logoUrl || logoGtst}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = logoGtst;
                  }}
                  alt={`${examName} logo`}
                  className="login-brand-logo"
                />
              </div>
              <h2>Student Login</h2>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  marginTop: "6px",
                }}
              >
                🎓 Open For Class 6, 7, 8 &amp; 9 Students
              </div>
              <p style={{ marginTop: "6px" }}>Enter your Aadhaar Number and Date of Birth to begin</p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginTop: "8px",
                }}
              >
                <span>⚡</span> Standalone Static Edition (No Server Required)
              </div>
            </div>

            {/* Quick Demo Selector */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "18px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#475569",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Quick Demo Logins (Click to Auto-Fill &amp; Enter):
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {MOCK_STUDENTS.map((std) => (
                  <button
                    key={std.id}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "12px", padding: "6px 12px", textAlign: "left" }}
                    onClick={() => handleQuickLogin(std)}
                  >
                    👤 <b>{std.name.split(" ")[0]}</b> <span style={{ fontSize: "11px", color: "#0369a1" }}>(Class {std.class.replace(/\D/g, "")})</span>
                    <span style={{ display: "block", fontSize: "11px", color: "#64748b" }}>
                      Aadhaar: {std.aadharNumber} · DOB: {std.dateOfBirthFormatted || std.dateOfBirth}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="aadharNumber">Aadhaar Number</label>
                <input
                  id="aadharNumber"
                  type="text"
                  placeholder="e.g. 5432 1098 7654"
                  value={aadharNumber}
                  onChange={handleAadharChange}
                  maxLength="14"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="dateOfBirth">Student Date of Birth (DOB)</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              {(error || sessionError) && (
                <div
                  role="alert"
                  className="notice-box"
                  style={{
                    background: "var(--danger-tint)",
                    borderColor: "#F0BDB6",
                    color: "#8B291F",
                  }}
                >
                  ⚠ {error || sessionError}
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Login to Exam Portal"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Landing;
