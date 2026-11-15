/**
 * Class helpers. The portal serves Class 6, 7, 8 and 9 students, and each
 * student only ever receives the question paper for their own class.
 */

export const SUPPORTED_CLASSES = [6, 7, 8, 9];

const WORDS = {
  six: 6, sixth: 6, seven: 7, seventh: 7, eight: 8, eighth: 8, nine: 9, ninth: 9,
  vi: 6, vii: 7, viii: 8, ix: 9,
};

/**
 * Turns "6", "6th", "Class 6", "6th Standard", "Grade VI", "sixth" ... into 6/7/8/9.
 * Returns null when the value is not one of the supported classes (e.g. "Class 10", "12th").
 */
export function normalizeClass(classVal) {
  if (classVal === null || classVal === undefined) return null;
  const clean = String(classVal).toLowerCase().trim();
  if (!clean) return null;
  const digit = clean.match(/(?:^|[^0-9])([0-9]{1,2})(?![0-9])/);
  if (digit) {
    const n = Number(digit[1]);
    return SUPPORTED_CLASSES.includes(n) ? n : null;
  }
  const word = clean.split(/[^a-z]+/).find((w) => WORDS[w]);
  return word ? WORDS[word] : null;
}

export function isSupportedClass(classVal) {
  return normalizeClass(classVal) !== null;
}

export function ordinal(n) {
  return `${n}th`;
}

export function classLabel(classVal) {
  const n = normalizeClass(classVal);
  return n ? `${ordinal(n)} Standard` : String(classVal || '');
}

export const ALLOWED_CLASS_LABEL = 'Class 6th, 7th, 8th or 9th';
