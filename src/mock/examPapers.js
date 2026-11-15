// Builds the class-wise exam paper (subjects + questions) from the question bank.
// getExamPaper(6) returns ONLY Class 6 questions, getExamPaper(7) only Class 7, and so on.
import { RAW_QUESTION_BANK } from './questionBank';
import { SUPPORTED_CLASSES, normalizeClass } from '../utils/classValidator';

// Figures used by diagram-based questions (Venn diagrams, graphs, dice, clocks ...).
const FIGURES = import.meta.glob('../assets/figures/*.png', { eager: true, import: 'default' });
const figureUrl = (name) => FIGURES[`../assets/figures/${name}.png`] || null;

// Full Exam: English (15), Science (15), Mathematics (15), and Aptitude (15) per class.
const SUBJECT_ORDER = [
  { name: 'English', key: 'ENGLISH', code: 'eng' },
  { name: 'Science', key: 'SCIENCE', code: 'sci' },
  { name: 'Mathematics', key: 'MATHEMATICS', code: 'math' },
  { name: 'Aptitude', key: 'APTITUDE', code: 'apt' },
];
const MARKS_PER_QUESTION = 4;
export const SECONDS_PER_QUESTION = 60;
// Full exam = 4 sections x 15 questions = 60 questions in 60 minutes (15 mins per section).
export const EXAM_DURATION_SECONDS = 60 * 60;

function buildPaper(cls) {
  const subjects = [];
  const questions = [];
  let seq = 0;

  SUBJECT_ORDER.filter((s) => RAW_QUESTION_BANK[cls][s.name]?.length).forEach((s, subjectIdx) => {
    const items = RAW_QUESTION_BANK[cls][s.name];
    const subjectId = `sub_c${cls}_${s.code}`;
    subjects.push({
      subjectId,
      subjectKey: s.key,
      subjectName: s.name,
      questionCount: items.length,
      displayOrder: subjectIdx + 1,
      durationSeconds: items.length * SECONDS_PER_QUESTION,
    });
    items.forEach((it, i) => {
      seq += 1;
      questions.push({
        id: `q_c${cls}_${s.code}_${i + 1}`,
        classLevel: cls,
        subjectId,
        subjectKey: s.key,
        subjectName: s.name,
        questionNumber: i + 1,
        sequenceNumber: seq,
        questionText: it.q,
        passage: null,
        imageUrl: it.img ? figureUrl(it.img) : null,
        marks: MARKS_PER_QUESTION,
        options: it.o,
        correctOption: it.a,
        explanation: `Correct answer: Option ${it.a} – ${it.o[it.a]}`,
      });
    });
  });

  return {
    classLevel: cls,
    subjects,
    questions,
    totalQuestions: questions.length,
    totalMarks: questions.length * MARKS_PER_QUESTION,
    totalDurationSeconds: EXAM_DURATION_SECONDS,
  };
}

const PAPERS = Object.fromEntries(SUPPORTED_CLASSES.map((c) => [c, buildPaper(c)]));

export function getExamPaper(classVal) {
  const cls = normalizeClass(classVal);
  return cls ? PAPERS[cls] : null;
}

export function examNameForClass(classVal) {
  const cls = normalizeClass(classVal);
  return cls
    ? `GTST+ Class ${cls} Examination 2026`
    : 'GTST+ Examination 2026';
}
