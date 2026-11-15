// Browser-based in-memory / localStorage mock backend for GTST+ Student Exam Portal.
// Completely eliminates the need for Node.js backend server or Supabase database.
import { normalizeClass, classLabel } from '../utils/classValidator';
import { getExamPaper, examNameForClass, SECONDS_PER_QUESTION } from './examPapers';
import logoGtst from '../assets/logos/logo-gtst.png';

const STORAGE_KEY = 'gtst_static_mock_state_v3';

export const MOCK_STUDENTS = [
  {
    id: 'std_001',
    aadharNumber: '5432 1098 7654',
    dateOfBirth: '2013-08-15',
    dateOfBirthFormatted: '15-08-2013',
    registrationId: 'GTST24-093157',
    hallTicketNumber: 'HT2026-701',
    name: 'Aarav Sharma',
    class: '7th Standard',
    examName: examNameForClass('7th'),
    examDate: '15th October 2026',
    shift: 'Morning Shift (10:00 AM - 11:30 AM)',
    centerName: 'Delhi Public School, Sector 12 - Digital Test Lab 02',
    email: 'aarav.sharma@example.com',
  },
  {
    id: 'std_002',
    aadharNumber: '6543 2109 8765',
    dateOfBirth: '2013-04-22',
    dateOfBirthFormatted: '22-04-2013',
    registrationId: 'GTST24-041822',
    hallTicketNumber: 'HT2026-702',
    name: 'Priya Patel',
    class: '7th Standard',
    examName: examNameForClass('7th'),
    examDate: '15th October 2026',
    shift: 'Morning Shift (10:00 AM - 11:30 AM)',
    centerName: 'Kendriya Vidyalaya, Hall 4 - Digital Test Center',
    email: 'priya.patel@example.com',
  },
  {
    id: 'std_demo',
    aadharNumber: '7654 3210 9876',
    dateOfBirth: '2013-12-10',
    dateOfBirthFormatted: '10-12-2013',
    registrationId: 'DEMO',
    hallTicketNumber: '12345',
    name: 'Rohan Verma (Demo Student, Class 7)',
    class: '7th Standard',
    examName: examNameForClass('7th'),
    examDate: '15th October 2026',
    shift: 'Morning Shift (10:00 AM - 11:30 AM)',
    centerName: 'GTST Model Test Lab 01',
    email: 'rohan.demo@gtst.org',
  },
  {
    id: 'std_demo_6',
    aadharNumber: '1111 2222 3333',
    dateOfBirth: '2014-06-12',
    dateOfBirthFormatted: '12-06-2014',
    registrationId: 'DEMO6',
    hallTicketNumber: '60001',
    name: 'Ananya Rao (Demo Student, Class 6)',
    class: '6th Standard',
    examName: examNameForClass('6th'),
    examDate: '15th October 2026',
    shift: 'Morning Shift (10:00 AM - 11:30 AM)',
    centerName: 'GTST Model Test Lab 03',
    email: 'ananya.demo@gtst.org',
  },
  {
    id: 'std_demo_8',
    aadharNumber: '9999 8888 7777',
    dateOfBirth: '2012-05-10',
    dateOfBirthFormatted: '10-05-2012',
    registrationId: 'DEMO8',
    hallTicketNumber: '80001',
    name: 'Kavya Singh (Demo Student, Class 8)',
    class: '8th Standard',
    examName: examNameForClass('8th'),
    examDate: '15th October 2026',
    shift: 'Morning Shift (10:00 AM - 11:30 AM)',
    centerName: 'GTST Model Test Lab 02',
    email: 'kavya.singh@example.com',
  },
  {
    id: 'std_demo_9',
    aadharNumber: '4444 5555 6666',
    dateOfBirth: '2011-09-03',
    dateOfBirthFormatted: '03-09-2011',
    registrationId: 'DEMO9',
    hallTicketNumber: '90001',
    name: 'Vikram Reddy (Demo Student, Class 9)',
    class: '9th Standard',
    examName: examNameForClass('9th'),
    examDate: '15th October 2026',
    shift: 'Morning Shift (10:00 AM - 11:30 AM)',
    centerName: 'GTST Model Test Lab 04',
    email: 'vikram.demo@gtst.org',
  },
];

// --- CLASS-WISE PAPER RESOLUTION -------------------------------------------
// The class of the logged-in student decides which question paper is served.
// Class 6 -> Class 6 questions only, Class 7 -> Class 7 only, and so on.
function readPersistedStudent() {
  try {
    const saved = JSON.parse(localStorage.getItem('gtst_student_session') || 'null');
    return saved?.student || null;
  } catch {
    return null;
  }
}

function resolveStudent(state) {
  return readPersistedStudent() || state.student || null;
}

// The logged-in student's own class always decides the paper. (A leftover session from someone
// else on the same browser is ignored here and is reset when the new student starts the exam.)
function resolvePaper(state) {
  const student = resolveStudent(state);
  const cls = normalizeClass(student?.class) || state.session?.classLevel;
  return cls ? getExamPaper(cls) : null;
}

// Real per-question deadline: each question gets SECONDS_PER_QUESTION from the moment it is first shown.
// Re-syncing with the backend (page refresh, tab focus, polling) must NOT give the student a fresh minute.
function startQuestionClock(state) {
  state.questionEndAt = Date.now() + SECONDS_PER_QUESTION * 1000;
}

function questionRemainingSeconds(state) {
  if (!state.questionEndAt) startQuestionClock(state);
  return Math.max(0, Math.ceil((state.questionEndAt - Date.now()) / 1000));
}

function requirePaper(state) {
  const paper = resolvePaper(state);
  if (!paper) {
    const err = new Error('Your class could not be determined. Only Class 6, 7, 8 and 9 students can take this examination. Please log in again.');
    err.status = 403;
    throw err;
  }
  return paper;
}

function getInitialState() {
  return {
    student: null,
    token: null,
    systemCheck: { camera: true, microphone: true, fullscreen: true, face: true },
    rulesAccepted: false,
    session: null,
    currentQuestionIndex: 0,
    answers: {}, // questionId -> selectedOption ('A'|'B'|'C'|'D')
    drafts: {},
    timeSpent: {},
    proctoringEvents: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    return JSON.parse(raw);
  } catch {
    return getInitialState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local storage unavailable
  }
}

export function resetMockState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('gtst_static_mock_state_v1');
  localStorage.removeItem('gtst_static_mock_state_v2');
  localStorage.removeItem('gtst_static_mock_state_v3');
  localStorage.removeItem('gtst_student_session');
  localStorage.removeItem('gtst_exam_gates');
}

// Emulates all backend routes synchronously / with micro-delays
export async function handleMockApiRequest(method, path, { body, token, isFormData } = {}) {
  // Simulate 30-50ms realistic network response time
  await new Promise((r) => setTimeout(r, 40));

  const state = loadState();

  // --- BRANDING ---
  if (path === '/api/exam/branding' && method === 'GET') {
    const brandCls = normalizeClass(resolveStudent(state)?.class);
    const brandData = {
      examName: examNameForClass(brandCls),
      logoUrl: logoGtst,
      bannerText: 'Global Talent Scholarship Test Plus · Official Student Examination Portal (Classes 6 - 9)',
      targetClass: brandCls ? classLabel(brandCls) : 'Classes 6 - 9',
    };
    return {
      branding: brandData,
      ...brandData,
    };
  }

  // --- AUTH LOGIN (Aadhaar Number & Date of Birth) ---
  if (path === '/api/exam/auth/login' && method === 'POST') {
    const rawAadhar = (body?.aadharNumber || body?.aadhaarNumber || body?.registrationId || '').replace(/\s+/g, '').trim();
    const dob = (body?.dateOfBirth || body?.dob || body?.hallTicketNumber || '').trim();

    if (!rawAadhar || !dob) {
      const err = new Error('Please enter both your Aadhaar Number and Date of Birth.');
      err.status = 400;
      throw err;
    }

    // Match existing mock student
    const cleanMatch = (val) => (val || '').replace(/[\s-]+/g, '').toUpperCase();

    const foundStudent = MOCK_STUDENTS.find((s) => {
      const aadharMatch = cleanMatch(s.aadharNumber) === cleanMatch(rawAadhar) ||
                          cleanMatch(s.registrationId) === cleanMatch(rawAadhar);
      const dobMatch = cleanMatch(s.dateOfBirth) === cleanMatch(dob) ||
                       cleanMatch(s.dateOfBirthFormatted) === cleanMatch(dob) ||
                       cleanMatch(s.hallTicketNumber) === cleanMatch(dob);
      return aadharMatch && dobMatch;
    });

    if (!foundStudent) {
      const err = new Error('No registration found for this Aadhaar number. Please check your credentials or register first.');
      err.status = 404;
      throw err;
    }

    // Only Class 6, 7, 8 and 9 students are allowed; their class decides their paper
    if (!normalizeClass(foundStudent.class)) {
      const err = new Error(`Access Denied: This examination portal is open for Class 6, 7, 8 and 9 students only. Your registered class is "${foundStudent.class}".`);
      err.status = 403;
      throw err;
    }

    const mockToken = `mock_jwt_${foundStudent.registrationId}_${Date.now()}`;
    state.student = foundStudent;
    state.token = mockToken;
    // Every student login starts completely fresh: clear any previous submitted exam session or result
    state.session = null;
    state.result = null;
    state.answers = {};
    state.drafts = {};
    state.timeSpent = {};
    state.currentQuestionIndex = 0;
    state.rulesAccepted = false;
    state.questionEndAt = null;
    state.proctoringEvents = [];
    saveState(state);

    return {
      success: true,
      student: foundStudent,
      token: mockToken,
    };
  }

  // --- AUTH HEARTBEAT ---
  if (path === '/api/exam/auth/heartbeat' && method === 'POST') {
    return {
      token: token || state.token || 'mock_jwt_token',
      refreshed: true,
    };
  }

  // --- AUTH LOGOUT ---
  if (path === '/api/exam/auth/logout' && method === 'POST') {
    state.student = null;
    state.token = null;
    saveState(state);
    return { success: true };
  }

  // --- EXAM INFO ---
  if (path === '/api/exam/info' && method === 'GET') {
    const paper = requirePaper(state);
    return {
      exam: {
        id: `exam_gtst_class${paper.classLevel}_2026`,
        name: examNameForClass(paper.classLevel),
        totalDurationSeconds: paper.totalDurationSeconds,
        totalQuestions: paper.totalQuestions,
        secondsPerQuestion: SECONDS_PER_QUESTION,
        totalMarks: paper.totalMarks,
        targetClass: classLabel(paper.classLevel),
      },
      subjects: paper.subjects,
    };
  }

  // --- EXAM SETTINGS ---
  if (path === '/api/exam/settings' && method === 'GET') {
    return {
      cameraRequired: true,
      photoCaptureEnabled: true,
      microphoneRequired: true,
      fullscreenRequired: true,
      proctoringEnabled: true,
      faceDetectionEnabled: true,
      videoRequired: false,
      networkMonitoringEnabled: true,
      tabSwitchMonitoringEnabled: true,
    };
  }

  // --- PROCTORING RULES ---
  if (path === '/api/exam/rules' && method === 'GET') {
    return {
      rules: [
        { id: '1', text: 'Remain seated directly in front of the camera with your face clearly visible at all times.' },
        { id: '2', text: 'Do not switch browser tabs, open other applications, or exit fullscreen mode.' },
        { id: '3', text: 'Ensure you are in a quiet, well-lit room with no other person present.' },
        { id: '4', text: 'Each question has a dedicated countdown timer and advances automatically when time runs out.' },
        { id: '5', text: 'Answers are securely saved on the server immediately when chosen.' },
        { id: '6', text: 'Any prohibited actions such as right-click, window blur, or multiple faces are recorded.' },
      ],
    };
  }

  // --- MOCK VIDEO ---
  if (path === '/api/exam/mock-video' && method === 'GET') {
    return { video: null };
  }

  // --- PRESENCE PING ---
  if (path === '/api/exam/presence' && method === 'POST') {
    return { success: true };
  }

  // --- SYSTEM CHECK SUBMIT ---
  if (path === '/api/exam/preflight/system-check' && method === 'POST') {
    state.systemCheck = { ...state.systemCheck, ...body };
    saveState(state);
    return { success: true };
  }

  // --- RULES ACCEPTED ---
  if (path === '/api/exam/preflight/rules-accepted' && method === 'POST') {
    state.rulesAccepted = true;
    saveState(state);
    return { success: true };
  }

  // --- SYSTEM CHECK SCREENSHOT UPLOAD ---
  if (path === '/api/exam/system-check/screenshot' && method === 'POST') {
    return {
      success: true,
      captured: true,
      applicable: true,
      url: logoGtst,
      uploadedAt: new Date().toISOString(),
    };
  }

  // --- LIVE MONITORING TOKENS ---
  if (path === '/api/exam/live-monitoring/publish-token' && method === 'POST') {
    return { token: 'mock_publisher_token' };
  }

  if (path === '/api/exam/live-monitoring/heartbeat' && method === 'POST') {
    return { success: true };
  }

  // --- PROCTORING EVENTS ---
  if (path === '/api/exam/proctoring/event' && method === 'POST') {
    state.proctoringEvents = state.proctoringEvents || [];
    state.proctoringEvents.push({ ...body, recordedAt: new Date().toISOString() });
    saveState(state);
    return { success: true };
  }

  // --- START OR RESUME EXAM SESSION ---
  if (path === '/api/exam/session/start' && method === 'POST') {
    const student = resolveStudent(state);
    const studentClass = normalizeClass(student?.class);
    const studentKey = student?.registrationId || student?.id || null;
    if (!studentClass) {
      const err = new Error('Your class could not be determined. Only Class 6, 7, 8 and 9 students can take this examination.');
      err.status = 403;
      throw err;
    }
    // A leftover session from a different student / class must never leak questions across classes.
    if (state.session && (state.session.classLevel !== studentClass || state.session.studentKey !== studentKey)) {
      state.session = null;
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.drafts = {};
      state.timeSpent = {};
      state.result = null;
    }
    const paper = getExamPaper(studentClass);
    if (!state.session) {
      const now = Date.now();
      state.session = {
        id: `sess_${Date.now()}`,
        status: 'IN_PROGRESS',
        classLevel: studentClass,
        studentKey,
        startedAt: new Date(now).toISOString(),
        examEndAt: new Date(now + paper.totalDurationSeconds * 1000).toISOString(),
        submittedAt: null,
      };
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.drafts = {};
      startQuestionClock(state);
      saveState(state);
    }

    const currentIdx = state.currentQuestionIndex || 0;
    const currentQ = paper.questions[currentIdx] || paper.questions[0];
    const currentSub = paper.subjects.find((s) => s.subjectId === currentQ.subjectId);

    const now = Date.now();
    const endMs = new Date(state.session.examEndAt).getTime();
    const remainingExamSec = Math.max(0, Math.floor((endMs - now) / 1000));

    return {
      success: true,
      session: state.session,
      exam: {
        id: `exam_gtst_class${paper.classLevel}_2026`,
        name: examNameForClass(paper.classLevel),
        totalQuestions: paper.totalQuestions,
        secondsPerQuestion: SECONDS_PER_QUESTION,
        totalMarks: paper.totalMarks,
      },
      examTiming: {
        remainingSeconds: remainingExamSec,
        examEndAt: state.session.examEndAt,
      },
      remainingSeconds: questionRemainingSeconds(state),
      sequenceNumber: currentIdx + 1,
      question: currentQ,
      subject: currentSub,
    };
  }

  // --- NAVIGATION / PALETTE ---
  if (path.startsWith('/api/exam/navigation') && method === 'GET') {
    const currentIdx = state.currentQuestionIndex || 0;
    const questions = requirePaper(state).questions.map((q, idx) => {
      const answered = state.answers[q.id] !== undefined && state.answers[q.id] !== null;
      return {
        id: q.id,
        questionNumber: q.questionNumber,
        sequenceNumber: q.sequenceNumber,
        subjectId: q.subjectId,
        subjectKey: q.subjectKey,
        subjectName: q.subjectName,
        answered,
        answer: state.answers[q.id] || null,
        locked: idx < currentIdx || state.session?.status === 'SUBMITTED',
        visited: idx <= currentIdx,
      };
    });

    return {
      success: true,
      questions,
    };
  }

  // --- CURRENT QUESTION ---
  if (path === '/api/exam/current-question' && method === 'GET') {
    if (state.session?.status === 'SUBMITTED') {
      return {
        submitted: true,
        examComplete: true,
        submittedAt: state.session.submittedAt,
      };
    }

    const paper = requirePaper(state);
    const currentIdx = state.currentQuestionIndex || 0;
    if (currentIdx >= paper.questions.length) {
      return {
        examComplete: true,
        remainingSeconds: 0,
      };
    }

    const currentQ = paper.questions[currentIdx];
    const currentSub = paper.subjects.find((s) => s.subjectId === currentQ.subjectId);
    const subIdx = paper.subjects.findIndex((s) => s.subjectId === currentQ.subjectId);

    const now = Date.now();
    const endMs = new Date(state.session.examEndAt).getTime();
    const remainingExamSec = Math.max(0, Math.floor((endMs - now) / 1000));

    return {
      success: true,
      question: currentQ,
      subject: currentSub,
      sequenceNumber: currentIdx + 1,
      subjectIndex: subIdx,
      questionIndex: currentQ.questionNumber - 1,
      selectedOption: state.drafts[currentQ.id] || state.answers[currentQ.id] || null,
      remainingSeconds: questionRemainingSeconds(state),
      examTiming: {
        remainingSeconds: remainingExamSec,
        examEndAt: state.session.examEndAt,
      },
    };
  }

  // --- SAVE DRAFT ANSWER ---
  if (path === '/api/exam/answers/draft' && method === 'POST') {
    const { questionId, selectedOption } = body || {};
    if (questionId) {
      state.drafts[questionId] = selectedOption;
      saveState(state);
    }
    return { success: true, saved: true };
  }

  // --- LOCK ANSWER AND ADVANCE ---
  if (path === '/api/exam/answers' && method === 'POST') {
    const { questionId, selectedOption, timeSpentSeconds } = body || {};
    const paper = requirePaper(state);
    if (questionId && paper.questions.some((q) => q.id === questionId)) {
      state.answers[questionId] = selectedOption;
      if (timeSpentSeconds) {
        state.timeSpent[questionId] = (state.timeSpent[questionId] || 0) + timeSpentSeconds;
      }
    }

    // Advance to next question
    const nextIdx = (state.currentQuestionIndex || 0) + 1;
    state.currentQuestionIndex = nextIdx;
    startQuestionClock(state);
    saveState(state);

    if (nextIdx >= paper.questions.length) {
      return {
        success: true,
        examComplete: true,
        message: 'All questions completed. Proceed to summary & submission.',
      };
    }

    const nextQ = paper.questions[nextIdx];
    const nextSub = paper.subjects.find((s) => s.subjectId === nextQ.subjectId);
    const subIdx = paper.subjects.findIndex((s) => s.subjectId === nextQ.subjectId);

    return {
      success: true,
      nextQuestion: nextQ,
      subject: nextSub,
      sequenceNumber: nextIdx + 1,
      nextSubjectIndex: subIdx,
      nextQuestionIndex: nextQ.questionNumber - 1,
      remainingSeconds: questionRemainingSeconds(state),
    };
  }

  // --- SUBMIT EXAM SESSION ---
  if (path === '/api/exam/session/submit' && method === 'POST') {
    const submittedAt = new Date().toISOString();
    if (state.session) {
      state.session.status = 'SUBMITTED';
      state.session.submittedAt = submittedAt;
    }

    // Calculate score
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;

    const paper = requirePaper(state);
    const reviewItems = paper.questions.map((q) => {
      const studentAns = state.answers[q.id] || null;
      const isCorrect = studentAns === q.correctOption;
      if (!studentAns) {
        unansweredCount += 1;
      } else if (isCorrect) {
        correctCount += 1;
        totalScore += q.marks;
      } else {
        wrongCount += 1;
      }

      return {
        id: q.id,
        sequenceNumber: q.sequenceNumber,
        subjectName: q.subjectName,
        questionText: q.questionText,
        imageUrl: q.imageUrl,
        options: q.options,
        correctOption: q.correctOption,
        studentAnswer: studentAns,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const maxScore = paper.totalMarks;
    const percentage = Math.round((totalScore / maxScore) * 100);

    state.result = {
      examName: examNameForClass(paper.classLevel),
      totalScore,
      maxScore,
      percentage,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      unanswered: unansweredCount,
      submittedAt,
      review: reviewItems,
    };

    saveState(state);

    return {
      success: true,
      submittedAt,
      session: {
        id: state.session?.id || 'sess_demo',
        status: 'SUBMITTED',
        submittedAt,
      },
    };
  }

  // --- RESET / RETAKE EXAM SESSION ---
  if ((path === '/api/exam/session/reset' || path === '/api/exam/session/retake') && method === 'POST') {
    state.session = null;
    state.result = null;
    state.answers = {};
    state.drafts = {};
    state.timeSpent = {};
    state.currentQuestionIndex = 0;
    state.rulesAccepted = false;
    state.questionEndAt = null;
    state.proctoringEvents = [];
    saveState(state);
    return {
      success: true,
      message: 'Exam session reset successfully. You can begin a fresh attempt.',
    };
  }

  // --- RESULT REPORT ---
  if (path === '/api/exam/result' && method === 'GET') {
    const student = resolveStudent(state);
    const studentKey = student?.registrationId || student?.id || null;
    if (!state.session || state.session.studentKey !== studentKey || state.session.status !== 'SUBMITTED') {
      return {
        submitted: false,
        published: false,
      };
    }

    // If result not calculated yet, compute it now
    if (!state.result) {
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;
      let totalScore = 0;

      const paper = requirePaper(state);
      const reviewItems = paper.questions.map((q) => {
        const studentAns = state.answers[q.id] || null;
        const isCorrect = studentAns === q.correctOption;
        if (!studentAns) {
          unansweredCount += 1;
        } else if (isCorrect) {
          correctCount += 1;
          totalScore += q.marks;
        } else {
          wrongCount += 1;
        }

        return {
          id: q.id,
          sequenceNumber: q.sequenceNumber,
          subjectName: q.subjectName,
          questionText: q.questionText,
          imageUrl: q.imageUrl,
          options: q.options,
          correctOption: q.correctOption,
          studentAnswer: studentAns,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const maxScore = paper.totalMarks;
      state.result = {
        examName: examNameForClass(paper.classLevel),
        totalScore,
        maxScore,
        percentage: Math.round((totalScore / maxScore) * 100),
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        unanswered: unansweredCount,
        submittedAt: state.session.submittedAt || new Date().toISOString(),
        review: reviewItems,
      };
      saveState(state);
    }

    return {
      submitted: true,
      published: true,
      result: state.result,
    };
  }

  // Fallback for unhandled endpoints
  return { success: true };
}
