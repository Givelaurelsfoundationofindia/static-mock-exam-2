import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ExamContext } from '../context/ExamContext';
import { BrandingContext } from '../context/BrandingContext';
import { fetchMyResult } from '../services/examService';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { usePreventBackNavigation } from '../hooks/usePreventBackNavigation';

const SuccessPage = () => {
  const { student, token } = useContext(AuthContext);
  const { submitTime, totalAnsweredCount, subjectsMeta } = useContext(ExamContext);
  const { examName } = useContext(BrandingContext);
  const navigate = useNavigate();
  usePreventBackNavigation();
  const [completion, setCompletion] = useState(null);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    setError(null);
    fetchMyResult(token)
      .then((data) => {
        if (cancelled) return;
        if (!data.submitted) {
          navigate('/dashboard', { replace: true });
          return;
        }
        setCompletion(data.completion || data.result || {});
      })
      .catch((failure) => {
        if (!cancelled) setError(failure.message || 'Unable to confirm your submission.');
      });
    return () => {
      cancelled = true;
    };
  }, [token, navigate, retry]);

  if (!student) return <Navigate to="/" replace />;

  const submittedAt = completion?.submittedAt || submitTime;
  const time = submittedAt
    ? new Date(submittedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      })
    : 'Recorded by the examination server';
  const total = completion?.totalQuestions ?? subjectsMeta.reduce((sum, subject) => sum + subject.questionCount, 0);
  const attempted = completion?.attemptedQuestions ?? totalAnsweredCount();

  return (
    <>
      <Header />
      <main className="page-wrap">
        <div className="card success-card" style={{ maxWidth: '580px', margin: '40px auto' }}>
          {completion ? (
            <>
              <div className="success-tick">✓</div>
              <h2>Exam Completed Successfully</h2>
              <p>Your examination has been submitted securely in the static demo portal.</p>
              <div className="success-info">
                <div className="row"><span>Student Name</span><span>{student.name}</span></div>
                <div className="row"><span>Aadhaar Number</span><span className="mono">{student.aadharNumber || student.registrationId}</span></div>
                <div className="row"><span>Date of Birth</span><span>{student.dateOfBirthFormatted || student.dateOfBirth || "15-08-2010"}</span></div>
                <div className="row"><span>Exam Name</span><span>{completion.examName || examName}</span></div>
                <div className="row"><span>Submission Time</span><span>{time}</span></div>
                {total > 0 && <div className="row"><span>Questions Attempted</span><span>{attempted} / {total}</span></div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  onClick={() => navigate('/result')}
                >
                  📊 View Examination Scorecard &amp; Results →
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Confirming Examination Submission</h2>
              <p role={error ? 'alert' : 'status'}>
                {error || 'Processing your attempt...'}
              </p>
              {error && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry verification
                </button>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SuccessPage;
