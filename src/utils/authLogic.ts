export interface StudentIdentityInput {
  school: string;
  grade: string;
  classNum: string;
  studentNum: string;
  birthDate: string;
  name: string;
}

export const ADMIN_TEACHER_EMAIL = 'liha1634@gmail.com';
export const BOOTSTRAPPED_ADMIN_EMAIL = 'planitia4ai@gmail.com';

export function isAuthorizedAdminEmail(email: string | null | undefined, emailVerified?: boolean): boolean {
  if (!email || !emailVerified) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === ADMIN_TEACHER_EMAIL || normalized === BOOTSTRAPPED_ADMIN_EMAIL;
}

/**
 * Converts a Korean/alphanumeric school name and student numbers into an ASCII-safe Firestore Document ID
 * matching `^[a-zA-Z0-9_\-]+$` (length 3..120).
 */
export function buildSafeStudentKey(input: {
  school: string;
  grade: string;
  classNum: string;
  studentNum: string;
}): string {
  const schoolTrimmed = input.school.trim().replace(/\s+/g, '');
  let schoolHex = '';
  for (let i = 0; i < Math.min(schoolTrimmed.length, 16); i++) {
    schoolHex += schoolTrimmed.charCodeAt(i).toString(16);
  }
  const g = String(parseInt(input.grade.trim(), 10) || 0);
  const c = String(parseInt(input.classNum.trim(), 10) || 0).padStart(2, '0');
  const n = String(parseInt(input.studentNum.trim(), 10) || 0).padStart(2, '0');
  return `stu_${schoolHex || 'sch'}_g${g}_c${c}_n${n}`.slice(0, 110);
}

/**
 * Normalizes birthDate to YYYY-MM-DD or 6-digit YYMMDD
 */
export function normalizeBirthDate(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  if (digits.length === 6) {
    return digits;
  }
  return raw.trim();
}

export function validateStudentRegistrationInput(input: StudentIdentityInput): {
  ok: boolean;
  error?: string;
} {
  const school = input.school.trim();
  const grade = input.grade.trim();
  const classNum = input.classNum.trim();
  const studentNum = input.studentNum.trim();
  const birthDate = normalizeBirthDate(input.birthDate);
  const name = input.name.trim();

  if (school.length < 2 || school.length > 40) {
    return { ok: false, error: '학교 이름을 2~40자 사이로 입력해 주세요. (예: 대한고등학교)' };
  }
  const gNum = Number(grade);
  if (!Number.isInteger(gNum) || gNum < 1 || gNum > 6) {
    return { ok: false, error: '학년을 1~6 사이의 숫자로 입력해 주세요.' };
  }
  const cNum = Number(classNum);
  if (!Number.isInteger(cNum) || cNum < 1 || cNum > 50) {
    return { ok: false, error: '반 번호를 1~50 사이의 숫자로 입력해 주세요.' };
  }
  const sNum = Number(studentNum);
  if (!Number.isInteger(sNum) || sNum < 1 || sNum > 99) {
    return { ok: false, error: '출석 번호를 1~99 사이의 숫자로 입력해 주세요.' };
  }
  const birthDigits = birthDate.replace(/[^0-9]/g, '');
  if (birthDigits.length !== 6 && birthDigits.length !== 8) {
    return { ok: false, error: '생년월일을 6자리(예: 090512) 또는 8자리(예: 2009-05-12)로 입력해 주세요.' };
  }
  if (name.length < 2 || name.length > 25) {
    return { ok: false, error: '이름을 2~25자 사이로 정확히 입력해 주세요.' };
  }

  return { ok: true };
}

/**
 * Formats a deterministic pseudo-MAC / Hardware Device ID from hardware traits + persistent token
 * Matches `^[a-zA-Z0-9_\-]+$` for Firestore rules compatibility while displaying a readable MAC format in UI.
 */
export function computeDeterministicDeviceHash(traits: string): string {
  let h1 = 0xdeadbeef ^ traits.length;
  let h2 = 0x41c6ce57 ^ traits.length;
  for (let i = 0, ch; i < traits.length; i++) {
    ch = traits.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  return `DEV_${hex.toUpperCase().slice(0, 12)}`;
}

export function formatDeviceHashAsMac(deviceHash: string): string {
  const clean = deviceHash.replace(/^DEV_/, '').replace(/[^0-9A-Fa-f]/g, '').padEnd(12, '0').slice(0, 12).toUpperCase();
  return clean.match(/.{1,2}/g)?.join(':') || deviceHash;
}
