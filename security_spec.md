# FormWise AI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Ownership**: Every document, preference, task, requirement, deadline, chat message, comparison, and AI log resides under `/users/{userId}/...` and requires `request.auth != null`, `request.auth.uid == userId`, and `request.auth.token.email_verified == true`.
2. **Parent Existence (Master Gate)**: Sub-resources (`tasks`, `requirements`, `deadlines`, `chats`) under `/users/{userId}/documents/{docId}` cannot be created unless the parent document exists and belongs to the same `userId`.
3. **Immutable Ownership & Creation Timestamps**: `userId`, `docId`, and `createdAt` are immutable once created. `createdAt` and `updatedAt` must match `request.time`.
4. **Strict Key Allowlisting**: No shadow/unrecognized fields may be written on create (`hasAll` + `hasOnly`) or update (`affectedKeys().hasOnly(...)`).
5. **Bounded Payloads**: All IDs match `^[a-zA-Z0-9_\-]+$` with max 128 chars; all strings and arrays have explicit upper bounds.
6. **No PII Leakage / No Blanket Reads**: No collection allows `isSignedIn()` without `userId == request.auth.uid`. `allow list` strictly requires `resource.data.userId == request.auth.uid`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Write**: Create `/users/userA/documents/doc1` with `auth = null`.
2. **Cross-User Read**: UserB (`uid: "userB"`) attempts `get` on `/users/userA/documents/doc1`.
3. **Cross-User List**: UserB attempts `list` on `/users/userA/documents`.
4. **Identity Spoofing on Create**: UserA attempts to create `/users/userA/documents/doc1` with `userId: "userB"`.
5. **Unverified Email Spoof**: UserA with `email_verified: false` attempts to write `/users/userA/documents/doc1`.
6. **Shadow / Ghost Field Injection**: UserA attempts to create `/users/userA/documents/doc1` with extra field `isAdmin: true`.
7. **ID Poisoning**: UserA attempts to create `/users/userA/documents/bad..id$with/slashes` or >128 char ID.
8. **Orphaned Sub-Resource Write**: UserA attempts to create `/users/userA/documents/nonexistentDoc/tasks/t1`.
9. **Immutable Field Tampering**: UserA attempts to update `createdAt` or `userId` on `/users/userA/documents/doc1`.
10. **Client Timestamp Forgery**: UserA creates `/users/userA/aiLogs/log1` with a backdated `createdAt` not equal to `request.time`.
11. **Value Poisoning (Oversized String)**: UserA updates `title` on a document with a 5,000-char string (exceeding max 240).
12. **Terminal/Type Confusion on AI Log**: UserA attempts to update an immutable `aiLogs/{logId}` record after creation or pass an invalid `inferenceSource: "fake_local"`.
