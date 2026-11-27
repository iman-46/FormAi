import type { WorkspaceDocument } from '../types';

export const DEMO_ADMISSION_NOTICE_TEXT = `NORTHBRIDGE INSTITUTE OF TECHNOLOGY (FICTIONAL DEMO INSTITUTION)
OFFICE OF UNDERGRADUATE ADMISSIONS — FALL 2027 CYCLE
NOTICE NO.: NIT/ADM/2027/041 (FICTIONAL COMPETITION SAMPLE DOCUMENT)

SECTION 1: PROVISIONAL ADMISSION & ELIGIBILITY CONDITIONS
Candidates who have received a Provisional Merit Rank in the Fall 2027 Entrance Assessment must confirm seat acceptance no later than March 18, 2027 at 5:00 PM EST. Eligibility requires a minimum cumulative secondary GPA of 3.20 on a 4.00 scale (or 75% aggregate in recognized national board examinations) with passing marks in Mathematics and Physics. Candidates awaiting final board transcripts may submit a Provisional Eligibility Undertaking, provided official sealed transcripts are verified prior to August 10, 2027. Failure to complete verification by August 10, 2027 results in automatic seat forfeiture without fee refund after the July 1, 2027 withdrawal window.

SECTION 2: MANDATORY vs. OPTIONAL SUPPORTING DOCUMENTS
All applicants MUST upload and present originals of the following mandatory documents during Document Verification:
1. Valid Government-Issued Photo Identity Proof (Passport, National ID, or Driver's License) — Mandatory.
2. Official Secondary School Marksheet & Passing Certificate (Grades 10 and 12) — Mandatory.
3. Two (2) recent passport-size color photographs on a white background — Mandatory.
4. Signed Seat Acceptance & Code of Conduct Declaration Form (Annexure B) — Mandatory.
5. Proof of Seat Confirmation Fee Payment ($450 USD refundable deposit) — Mandatory.

Conditional / Optional Documents (submit only if applicable):
- Certified Household Income Certificate (required ONLY if applying for Need-Based Tuition Grant).
- Category / Disability Accommodation Certificate (optional; required only if requesting testing or housing accommodations).
- Transfer / Migration Certificate (may be submitted by August 10, 2027 if not yet issued by your current school).

SECTION 3: KEY DEADLINES & TIMELINE
- March 18, 2027 (5:00 PM EST): Final deadline for Online Seat Acceptance and $450 USD Seat Confirmation Fee payment.
- March 25, 2027 – March 29, 2027: Mandatory In-Person or Video Document Verification slots (assigned alphabetically; exact slot time will be emailed 48 hours prior — verify your portal).
- April 14, 2027: Need-Based Tuition Grant & Scholarship Application deadline.
- May 2027 (exact date to be announced by Housing Office): On-campus dormitory preference window opens.
- July 1, 2027: Last date for full refund upon formal admission withdrawal.
- August 10, 2027: Final cut-off for pending official board transcripts and Transfer Certificates.
- August 24, 2027: Mandatory New Student Orientation & Academic Advising Day.

SECTION 4: LATE FEE & MISSED DEADLINE POLICY
Applicants who fail to submit the Seat Confirmation Fee by March 18, 2027 will have their provisional offer revoked automatically and reallocated to Waitlist Round 2. Late document verification is not permitted except for verified medical emergencies approved in writing by the Registrar before March 24, 2027.

DISCLAIMER: This notice is a fictional sample created solely for the FormWise AI #BuildHybridAI 2026 competition demonstration.`;

export const DEMO_ADDENDUM_NOTICE_TEXT = `NORTHBRIDGE INSTITUTE OF TECHNOLOGY (FICTIONAL DEMO INSTITUTION)
ADDENDUM NO. 1 TO ADMISSION NOTICE NIT/ADM/2027/041 (FICTIONAL COMPETITION SAMPLE)

REVISION EFFECTIVE FEBRUARY 28, 2027:
1. EXTENDED SEAT ACCEPTANCE DEADLINE: The deadline for Online Seat Acceptance and Seat Confirmation Fee payment has been extended from March 18, 2027 to March 24, 2027 (11:59 PM EST).
2. FEE ADJUSTMENT: The Seat Confirmation Fee deposit is now $500 USD (previously $450 USD) and includes the $50 Orientation Materials fee.
3. DOCUMENT REQUIREMENT CHANGE: Transfer / Migration Certificates must now be uploaded in digital PDF format during the March 25–29 verification window; August 10 extensions are no longer granted for Transfer Certificates.
4. PHOTOGRAPH RULE: Physical passport photographs are no longer required if you upload a high-resolution digital headshot (JPEG/PNG) in the portal.
5. CONFLICTING / NEW HOUSING RULE: On-campus dormitory applications will now open on April 18, 2027 (replacing the tentative May 2027 schedule) and require the Seat Confirmation Fee receipt ID.
6. REFUND WINDOW: Full refund withdrawal deadline remains July 1, 2027, minus a $35 administrative processing fee.`;

export function createDemoDocumentRecord(userId: string): WorkspaceDocument {
  return {
    id: 'demo_nit_admission_2027',
    userId,
    title: 'Demo: Northbridge Institute Fall 2027 Admission Notice',
    fileName: 'NIT_Admission_Notice_Fall2027_DEMO.txt',
    mimeType: 'text/plain',
    fileSize: new Blob([DEMO_ADMISSION_NOTICE_TEXT]).size,
    pageCount: 2,
    extractionStatus: 'ready',
    isScanned: false,
    isDemo: true,
    extractedText: DEMO_ADMISSION_NOTICE_TEXT,
    lastInferenceSource: 'none',
  };
}

export function createDemoAddendumRecord(userId: string): WorkspaceDocument {
  return {
    id: 'demo_nit_addendum_2027',
    userId,
    title: 'Demo: Northbridge Addendum No. 1 (Revised Policy)',
    fileName: 'NIT_Admission_Addendum_1_DEMO.txt',
    mimeType: 'text/plain',
    fileSize: new Blob([DEMO_ADDENDUM_NOTICE_TEXT]).size,
    pageCount: 1,
    extractionStatus: 'ready',
    isScanned: false,
    isDemo: true,
    extractedText: DEMO_ADDENDUM_NOTICE_TEXT,
    lastInferenceSource: 'none',
  };
}
