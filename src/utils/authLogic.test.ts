import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAuthorizedAdminEmail,
  buildSafeStudentKey,
  normalizeBirthDate,
  validateStudentRegistrationInput,
  computeDeterministicDeviceHash,
  formatDeviceHashAsMac,
} from './authLogic.ts';

test('isAuthorizedAdminEmail strictly allows verified liha1634@gmail.com', () => {
  assert.equal(isAuthorizedAdminEmail('liha1634@gmail.com', true), true);
  assert.equal(isAuthorizedAdminEmail('LIHA1634@gmail.com', true), true);
  assert.equal(isAuthorizedAdminEmail('liha1634@gmail.com', false), false);
  assert.equal(isAuthorizedAdminEmail('otherteacher@gmail.com', true), false);
  assert.equal(isAuthorizedAdminEmail(null, true), false);
});

test('buildSafeStudentKey produces valid Firestore ID matching ^[a-zA-Z0-9_\\-]+$', () => {
  const key = buildSafeStudentKey({
    school: '세종과학고등학교',
    grade: '1',
    classNum: '3',
    studentNum: '15',
  });
  assert.match(key, /^[a-zA-Z0-9_\-]+$/);
  assert.ok(key.length >= 3 && key.length <= 120);
  assert.ok(key.endsWith('_g1_c03_n15'));
});

test('validateStudentRegistrationInput validates school, grade, class, number, birthDate, and name', () => {
  const valid = validateStudentRegistrationInput({
    school: '한빛고등학교',
    grade: '1',
    classNum: '3',
    studentNum: '15',
    birthDate: '2009-05-12',
    name: '김탐정',
  });
  assert.equal(valid.ok, true);

  const invalidBirth = validateStudentRegistrationInput({
    school: '한빛고등학교',
    grade: '1',
    classNum: '3',
    studentNum: '15',
    birthDate: '123',
    name: '김탐정',
  });
  assert.equal(invalidBirth.ok, false);
});

test('computeDeterministicDeviceHash and formatDeviceHashAsMac produce consistent identifiers', () => {
  const hash = computeDeterministicDeviceHash('iPadOS_Safari_820x1180_token123');
  assert.match(hash, /^DEV_[0-9A-F]{12}$/);
  const mac = formatDeviceHashAsMac(hash);
  assert.match(mac, /^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/);
  assert.equal(normalizeBirthDate('20090512'), '2009-05-12');
});
