import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { isSupportedClass } from '../../utils/classValidator';
import Header from './Header';
import Footer from './Footer';

const ProtectedRoute = () => {
  const { isAuthenticated, authLoading, student, logout } = useContext(AuthContext);

  // Wait for the localStorage restore check before deciding
  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Strict Gate: Only Class 6, 7, 8 and 9 students can open/access the portal
  if (student && !isSupportedClass(student.class)) {
    return (
      <>
        <Header />
        <div className="tricolor"></div>
        <div className="page-wrap" style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card centered-status-card" style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center', padding: '36px 28px', borderTop: '4px solid #dc2626' }}>
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>🚫</div>
            <h2 style={{ color: '#991b1b', marginBottom: '8px', fontSize: '22px' }}>Access Restricted</h2>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              background: '#fef2f2',
              color: '#991b1b',
              fontWeight: 700,
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #fecaca'
            }}>
              Open For Class 6, 7, 8 &amp; 9 Students Only
            </div>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '18px' }}>
              Your profile is registered under <b>{student.class || 'an unsupported class'}</b>. Only students currently enrolled in <b>Class 6, 7, 8 or 9</b> are authorized to open and take this examination.
            </p>
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              style={{ background: '#0a6b6e', border: 'none' }}
            >
              Log Out &amp; Return to Home
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
