import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { fetchMyResult } from '../services/examService';

const ResultPage = () => {
  const navigate = useNavigate();
  const { student, token } = useContext(AuthContext);
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    if (!student || !token) return undefined;
    let cancelled = false;
    fetchMyResult(token)
      .then((data) => { if (!cancelled) setState({ loading: false, error: '', data }); })
      .catch((error) => { if (!cancelled) setState({ loading: false, error: error.message || 'Unable to load your result.', data: null }); });
    return () => { cancelled = true; };
  }, [student, token]);

  if (!student) {
    return <Navigate to="/" replace />;
  }

  const result = state.data?.published ? state.data.result : null;

  return (
    <>
      <Header />
      <div className="tricolor"></div>
      <div className="page-wrap">
        <div className="page-head" style={{ textAlign: 'center' }}>
          <h1>Examination Result &amp; Scorecard</h1>
          <p>{result?.examName || student.examName}</p>
        </div>
        <div className="summary-grid" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card result-score-card" style={{ padding: '32px 26px', textAlign: 'center' }}>
            <div className="faint" style={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>Student</div>
            <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>{student.name}</div>
            <div className="muted mono" style={{ fontSize: '12.5px', marginBottom: '22px' }}>Aadhaar: {student.aadharNumber || student.registrationId} · Class {student.class}</div>
            {state.loading ? (
              <p style={{ fontSize: '14px', color: 'var(--ink-muted)' }}>Loading your result…</p>
            ) : state.error ? (
              <p style={{ fontSize: '14px', color: 'var(--danger)' }}>{state.error}</p>
            ) : result ? (
              <>
                <div style={{ fontSize: '38px', fontWeight: '800', color: 'var(--navy)' }}>
                  {result.totalScore} <span style={{ fontSize: '20px', color: '#64748b' }}>/ {result.maxScore}</span>
                </div>
                <div className="muted" style={{ fontSize: '15px', fontWeight: '600', marginBottom: '18px', color: '#0284c7' }}>
                  Score: {result.percentage}%
                </div>
                <div className="stat-mini-grid" style={{ marginBottom: '24px' }}>
                  <div className="stat-mini"><b>{result.correctAnswers}</b><span>CORRECT</span></div>
                  <div className="stat-mini"><b>{result.wrongAnswers}</b><span>WRONG</span></div>
                  <div className="stat-mini"><b>{result.unanswered}</b><span>UNANSWERED</span></div>
                </div>
              </>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--ink-muted)' }}>
                {state.data?.submitted === false
                  ? 'No submitted examination was found for your account.'
                  : 'Your result is being compiled. Please check back shortly.'}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Solutions & Explanations Review */}
        {result?.review && result.review.length > 0 && (
          <div style={{ maxWidth: '850px', margin: '36px auto 0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)' }}>
                📝 Detailed Question Review &amp; Explanations
              </h2>
              <span style={{ fontSize: '13px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '14px', fontWeight: 600 }}>
                {result.review.length} Questions Reviewed
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {result.review.map((item, idx) => {
                const letters = ['A', 'B', 'C', 'D'];
                return (
                  <div
                    key={item.id || idx}
                    className="card result-review-card"
                    style={{
                      padding: '22px 24px',
                      borderLeft: `4px solid ${item.isCorrect ? '#16a34a' : !item.studentAnswer ? '#f59e0b' : '#dc2626'}`,
                      background: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          {item.subjectName}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                          Q{item.sequenceNumber}.
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: item.isCorrect ? '#dcfce7' : !item.studentAnswer ? '#fef3c7' : '#fee2e2',
                          color: item.isCorrect ? '#15803d' : !item.studentAnswer ? '#b45309' : '#b91c1c'
                        }}
                      >
                        {item.isCorrect ? '✓ Correct (+4)' : !item.studentAnswer ? '⚪ Unanswered (0)' : '✗ Incorrect (0)'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '0 0 14px 0', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                      {item.questionText}
                    </h4>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="Question figure" style={{ maxWidth: '100%', maxHeight: '260px', margin: '0 0 14px 0', display: 'block' }} />
                    )}

                    {/* Options list */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '8px', marginBottom: '14px' }}>
                      {letters.map((optLetter) => {
                        const optText = item.options[optLetter];
                        const isStudentSel = item.studentAnswer === optLetter;
                        const isCorrectOpt = item.correctOption === optLetter;

                        let optBg = '#f8fafc';
                        let optBorder = '#e2e8f0';
                        let optColor = '#334155';

                        if (isCorrectOpt) {
                          optBg = '#f0fdf4';
                          optBorder = '#86efac';
                          optColor = '#166534';
                        } else if (isStudentSel && !isCorrectOpt) {
                          optBg = '#fef2f2';
                          optBorder = '#fca5a5';
                          optColor = '#991b1b';
                        }

                        return (
                          <div
                            key={optLetter}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: `1.5px solid ${optBorder}`,
                              background: optBg,
                              fontSize: '13.5px',
                              color: optColor,
                              fontWeight: isCorrectOpt || isStudentSel ? 600 : 400
                            }}
                          >
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isCorrectOpt ? '#16a34a' : isStudentSel ? '#dc2626' : '#e2e8f0',
                                color: isCorrectOpt || isStudentSel ? '#ffffff' : '#475569',
                                fontSize: '11px',
                                fontWeight: 700,
                                flexShrink: 0
                              }}
                            >
                              {optLetter}
                            </span>
                            <span style={{ flex: 1 }}>{optText}</span>
                            {isCorrectOpt && <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>✓ Correct</span>}
                            {isStudentSel && !isCorrectOpt && <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>✗ Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {item.explanation && (
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderLeft: '3px solid #0284c7',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: '#334155',
                          lineHeight: '1.55'
                        }}
                      >
                        <b style={{ color: '#0369a1' }}>💡 Explanation: </b>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ResultPage;
