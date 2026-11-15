import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { BrandingContext } from "../../context/BrandingContext";
import logoGtst from "../../assets/logos/logo-gtst.png";

const formatISTTime = () => {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const Header = () => {
  const [istTime, setIstTime] = useState(formatISTTime);
  const { student, logout } = useContext(AuthContext);
  const { examName, logoUrl } = useContext(BrandingContext);
  const navigate = useNavigate();

  // The admin sets a single Exam Name field (e.g. "Global Talent
  // Scholarship Test Plus · South India Level") — split on the first
  // " · " for the existing two-line org/sub-line layout when present,
  // otherwise render the whole name on one line rather than guessing at
  // a split that isn't there.
  const separatorIndex = examName.indexOf(" · ");
  const orgLine = separatorIndex === -1 ? examName : examName.slice(0, separatorIndex);
  const subLine = separatorIndex === -1 ? null : examName.slice(separatorIndex + 3);

  useEffect(() => {
    const id = setInterval(() => setIstTime(formatISTTime()), 1000);
    return () => clearInterval(id);
  }, []);

  // Not rendered on the exam-taking screen itself (ExamPage builds its
  // own inline header, deliberately without this) — logout only makes
  // sense on the pre/post-exam pages this component is actually used on.
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="brand-row">
        <img
          src={logoUrl || logoGtst}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = logoGtst;
          }}
          className="brand-logo"
          alt={`${examName} logo`}
          style={{
            height: "48px",
            width: "auto",
            background: "#fff",
            borderRadius: "8px",
            padding: "6px 10px",
          }}
        />
        <div className="brand-text" style={{ lineHeight: "1.2" }}>
          <span
            className="org"
            style={{
              fontSize: "18px",
              fontWeight: "800",
              letterSpacing: "0.3px",
            }}
          >
            {orgLine}
          </span>
          {subLine && (
            <span
              className="sub"
              style={{ fontSize: "13px", color: "#B9C6E0", fontWeight: "500" }}
            >
              {subLine}
            </span>
          )}
        </div>
        <div className="header-right">
          <div className="header-ist-clock">
            <span className="header-ist-time">{istTime}</span>
            <span className="header-ist-tz">IST</span>
          </div>
          {student && (
            <button
              type="button"
              className="header-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
