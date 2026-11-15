import React, { useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SystemCheckContext } from '../context/SystemCheckContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { usePreventBackNavigation } from '../hooks/usePreventBackNavigation';
import { normalizeClass } from '../utils/classValidator';

const StudentConfirmPage = () => {
  const { student } = useContext(AuthContext);
  const { resetSystemCheck } = useContext(SystemCheckContext);
  const navigate = useNavigate();
  usePreventBackNavigation();

  if (!student) {
    return <Navigate to="/" replace />;
  }

  const handleContinue = () => {
    resetSystemCheck();
    navigate('/dashboard', { replace: true });
  };

  return (
    <>
      <Header />
      <div className="tricolor"></div>
      <div className="page-wrap">
        <div className="page-head" style={{ textAlign: 'center' }}>
          <h1>Welcome, {student.name.split(' ')[0]}</h1>
          <p>Please verify your details before proceeding to the examination.</p>
        </div>
        <div className="card confirm-card">
          <div className="student-info-grid">
            <div className="info-item"><div className="k">Student Name</div><div className="v">{student.name}</div></div>
            <div className="info-item"><div className="k">Aadhaar Number</div><div className="v mono">{student.aadharNumber || student.registrationId}</div></div>
            <div className="info-item"><div className="k">Date of Birth</div><div className="v">{student.dateOfBirthFormatted || student.dateOfBirth || "15-08-2010"}</div></div>
            <div className="info-item"><div className="k">Class</div><div className="v" style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}><b style={{ color: '#0369a1' }}>{student.class}</b> <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>✓ Class {normalizeClass(student.class)} Paper</span></div></div>
            <div className="info-item"><div className="k">Exam Date</div><div className="v">{student.examDate}</div></div>
          </div>
          <div className="notice-box">✔️ <span>Please verify your details. You will receive the Class {normalizeClass(student.class)} question paper only.</span></div>
          <button className="btn btn-primary btn-block btn-lg" onClick={handleContinue}>Continue to Dashboard →</button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default StudentConfirmPage;