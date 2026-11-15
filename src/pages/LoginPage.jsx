import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BrandingContext } from '../context/BrandingContext';
import { supabaseStudentLogin } from '../services/supabaseAuth';
import { MOCK_STUDENTS } from '../mock/mockExamBackend';
import { normalizeClass, classLabel } from '../utils/classValidator';
import { examNameForClass } from '../mock/examPapers';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import logoImg from '../assets/logos/logo-gtst.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithStudent, isAuthenticated } = useContext(AuthContext);
  const { examName } = useContext(BrandingContext);

  const [aadharNumber, setAadharNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/student-confirm', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const formatAadharInput = (value) => {
    const raw = value.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleAadharChange = (e) => {
    setAadharNumber(formatAadharInput(e.target.value));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanAadhar = aadharNumber.replace(/\D/g, '');
    if (cleanAadhar.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (!password) {
      setError('Please enter your password or Date of Birth');
      return;
    }

    setIsLoading(true);

    try {
      let studentProfile = null;

      // 1. Check live Supabase student authentication
      try {
        const response = await supabaseStudentLogin(cleanAadhar, password);
        if (response && response.success && response.data) {
          const data = response.data;
          const assignedClass = data.classLevel || data.studentClass || data.class || '';

          // The student's own class decides which question paper they get (Class 6 / 7 / 8 / 9 only)
          const studentClassNum = normalizeClass(assignedClass);
          if (!studentClassNum) {
            setError(assignedClass
              ? `⛔ Access Denied: This examination is open for Class 6, 7, 8 and 9 students only. Your profile indicates you are registered in "${assignedClass}".`
              : '⛔ Your class could not be found in your profile. Please contact the exam coordinator.');
            setIsLoading(false);
            return;
          }

          studentProfile = {
            id: data.id || `std_${data.registrationId}`,
            name: data.fullName || 'Student Candidate',
            aadharNumber: `${cleanAadhar.slice(0, 4)} ${cleanAadhar.slice(4, 8)} ${cleanAadhar.slice(8, 12)}`,
            dateOfBirth: password,
            dateOfBirthFormatted: password,
            registrationId: data.registrationId || `GTST-${cleanAadhar.slice(-6)}`,
            hallTicketNumber: data.hallTicketNumber || `HT-${cleanAadhar.slice(-4)}`,
            class: classLabel(studentClassNum),
            examName: examNameForClass(studentClassNum),
            examDate: '15th October 2026',
            shift: 'Morning Shift (10:00 AM - 11:30 AM)',
            centerName: data.schoolName ? `${data.schoolName} - Digital Lab` : 'GTST Examination Lab 01',
            email: data.email || 'student@gtst.org',
            mobile: data.mobile || '',
            schoolName: data.schoolName || '',
            paymentStatus: data.paymentStatus || 'SUCCESS',
            stepCompletedPayment: data.stepCompletedPayment ?? true,
          };
        }
      } catch (err) {
        console.warn('Supabase authentication check bypassed/failed, checking local student store:', err);
      }

      // 2. Check local mock students store
      if (!studentProfile) {
        const cleanMatch = (val) => (val || '').replace(/[\s-]+/g, '').toUpperCase();
        const found = MOCK_STUDENTS.find((s) => {
          const aadharMatch = cleanMatch(s.aadharNumber) === cleanMatch(cleanAadhar) ||
                              cleanMatch(s.registrationId) === cleanMatch(cleanAadhar);
          const dobMatch = cleanMatch(s.dateOfBirth) === cleanMatch(password) ||
                           cleanMatch(s.dateOfBirthFormatted) === cleanMatch(password) ||
                           cleanMatch(s.hallTicketNumber) === cleanMatch(password);
          return aadharMatch && dobMatch;
        });

        if (found) {
          if (!normalizeClass(found.class)) {
            setError(`⛔ Access Denied: This examination is open for Class 6, 7, 8 and 9 students only. Your profile indicates you are registered in "${found.class}".`);
            setIsLoading(false);
            return;
          }

          studentProfile = { ...found };
        }
      }

      if (studentProfile) {
        sessionStorage.setItem('studentLoggedIn', 'true');
        sessionStorage.setItem('studentName', studentProfile.name);
        sessionStorage.setItem('hallTicketNumber', studentProfile.hallTicketNumber);
        sessionStorage.setItem('studentClass', studentProfile.class);
        sessionStorage.setItem('aadhaarNumber', cleanAadhar);
        sessionStorage.setItem('studentEmail', studentProfile.email);
        sessionStorage.setItem('studentMobile', studentProfile.mobile);
        sessionStorage.setItem('schoolName', studentProfile.schoolName || '');
        sessionStorage.setItem('registrationId', studentProfile.registrationId);
        sessionStorage.setItem('paymentCompleted', 'true');

        loginWithStudent(studentProfile);
        navigate('/student-confirm', { replace: true });
      } else {
        setError('Invalid credentials. Please verify your 12-digit Aadhaar Number and Date of Birth (DD-MM-YYYY).');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected login error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="login-page-wrap" style={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #E8E6FF 0%, #F3F1FF 35%, #FFF8F5 70%, #FFFFFF 100%)',
        padding: '40px 20px',
        boxSizing: 'border-box'
      }}>
        <div className="login-page-card" style={{
          background: 'white',
          padding: '36px 32px',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          maxWidth: '480px',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img
              src={logoImg}
              alt="GTST+"
              style={{ height: '65px', margin: '0 auto 10px', display: 'block', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/80x80/1a237e/white?text=GTST+';
              }}
            />
            <h2 style={{ color: '#1a237e', margin: '0', fontSize: '24px', fontWeight: 700 }}>Student Portal Login</h2>
            <p style={{ color: '#64748b', marginTop: '8px', fontSize: '13px' }}>
              Enter your registered Aadhaar number and DOB to begin your exam
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#333',
                fontSize: '14px'
              }}>
                Aadhaar Number <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                type="text"
                value={aadharNumber}
                onChange={handleAadharChange}
                placeholder="Enter 12-digit Aadhaar number"
                maxLength="14"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0a6b6e')}
                onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                color: '#333',
                fontSize: '14px'
              }}>
                Password / Date of Birth <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter DOB (DD/MM/YYYY) or custom password"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    paddingRight: '45px',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0a6b6e')}
                  onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#666',
                    padding: '4px'
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '6px' }}>
                💡 Your Date of Birth (DD/MM/YYYY) is your default password
              </small>
            </div>

            {error && (
              <div style={{
                color: '#d32f2f',
                fontSize: '13px',
                marginBottom: '18px',
                padding: '10px 12px',
                background: '#ffebee',
                borderRadius: '8px',
                border: '1px solid #ffcdd2',
                lineHeight: '1.4'
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '13px',
                background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #0a6b6e, #0a4b4e)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(10,107,110,0.25)'
              }}
            >
              {isLoading ? 'Verifying with Supabase...' : 'Login to Exam Portal'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoginPage;
