# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Admin Authority Invariant**:
   - Only a Google-authenticated user with `request.auth.token.email_verified == true` and email matching `liha1634@gmail.com` (or bootstrapped runtime developer `planitia4ai@gmail.com`) is recognized as `isAdmin()`.
   - Only `isAdmin()` can list all `/student_registrations`, change a student's `status` from `'pending'` to `'approved'` or `'rejected'`, or delete registrations/device locks.
2. **Self-Registration & Duplicate Prevention Invariant**:
   - A student registration document `/student_registrations/{studentKey}` can only be created with `status == 'pending'`. Students can never self-approve (`status: 'approved'` on create is strictly rejected).
   - Creation of `/student_registrations/{studentKey}` requires atomic creation (`existsAfter`) of `/device_locks/{deviceHash}` where `deviceHash == incoming().deviceHash`, preventing duplicate sign-ups from the same device/MAC fingerprint.
3. **Immutable Roster & Device Identity Invariant**:
   - Once created, a student cannot mutate `studentKey`, `school`, `grade`, `classNum`, `studentNum`, `birthDate`, `name`, `deviceHash`, `ipAddress`, or `createdAt`.
   - Approved students can only update `worksheetJson` and `updatedAt` (with `updatedAt == request.time`) when `existing().status == 'approved'` and `incoming().deviceHash == existing().deviceHash`.

## 2. The "Dirty Dozen" Payloads

1. **Shadow Field Injection**: Creating `/student_registrations/s1` with an extra field `"isAdmin": true` -> `PERMISSION_DENIED` (blocked by `.keys().hasOnly(...)`).
2. **Self-Approval Attack**: Creating `/student_registrations/s1` with `"status": "approved"` -> `PERMISSION_DENIED` (must be `"pending"` on create).
3. **Unverified Admin Email Spoof**: Attempting `list` or `update` of `status` with `email == 'liha1634@gmail.com'` but `email_verified == false` -> `PERMISSION_DENIED`.
4. **Non-Admin Status Escalation**: Unauthenticated or non-admin user attempting to update `status` from `'pending'` to `'approved'` -> `PERMISSION_DENIED`.
5. **Unapproved Student Worksheet Write**: Student with `status == 'pending'` or `'rejected'` attempting to update `worksheetJson` -> `PERMISSION_DENIED`.
6. **ID Poisoning Attack**: Document ID `{studentKey}` > 120 chars or containing special characters (`../admin`) -> `PERMISSION_DENIED` (`isValidId()`).
7. **Denial-of-Wallet Oversized Payload**: `worksheetJson` exceeding 150,000 characters or `name` exceeding 25 characters -> `PERMISSION_DENIED`.
8. **Timestamp Forgery**: Client passing a forged past/future `createdAt` or `updatedAt` instead of `request.time` -> `PERMISSION_DENIED`.
9. **Immutable Identity Mutation**: Approved student attempting to change `name`, `birthDate`, or `deviceHash` during a worksheet update -> `PERMISSION_DENIED`.
10. **Orphan Registration Without Device Lock**: Creating `/student_registrations/{studentKey}` without atomically creating `/device_locks/{deviceHash}` -> `PERMISSION_DENIED`.
11. **Device Lock Hijack**: Attempting to overwrite an existing `/device_locks/{deviceHash}` for a different `studentKey` without admin privileges -> `PERMISSION_DENIED`.
12. **Blanket List Scraping**: Non-admin attempting `list` on `/student_registrations` -> `PERMISSION_DENIED`.
