# GTST+ Static Student Exam Portal (Standalone Edition)

This is a **100% standalone static web application** created from the existing student frontend. It operates **completely in the browser without any backend server or database**.

---

## 🌟 Key Features

- **Zero Backend / Database Dependencies**: Emulates all 22 exam API endpoints directly in browser memory and `localStorage`.
- **Full Candidate Flow**:
  1. **Candidate Login**: Enter any Registration ID and Hall Ticket Number (or use one-click demo login buttons).
  2. **Candidate Verification**: Review candidate name, registration ID, hall ticket, class, and exam schedule.
  3. **Pre-Exam Dashboard**: Review exam instructions, duration, section breakdowns, and start exam.
  4. **System Requirements Check**:
     - Live camera feed and microphone audio level meter.
     - Fullscreen verification and face detection.
     - Check-in photo capture.
     - **⚡ Demo Bypass**: Includes an instant "Pass All Checks" button for testing without requiring physical camera/microphone permissions.
  5. **Proctoring Rules**: Review exam rules and proctoring requirements.
  6. **Interactive Examination**:
     - **Class-wise papers**: Class 6, 7, 8 and 9 students each get only their own class's 60 questions across 4 subjects (15 English + 15 Science + 15 Mathematics + 15 Aptitude), loaded from `src/mock/questionBank.js` (generated from the Class_N English/Science Excel files and Mathematics/Aptitude Question Papers with all diagrams).
     - Dedicated per-question timer and overall examination countdown timer.
     - Real-time draft answer saving, option selection, and navigation palette.
     - Proctoring event detection (tab switch, window blur, fullscreen exit).
  7. **Exam Summary**: View attempted, unattempted, and flagged questions count before submission.
  8. **Submission & Scorecard**: Instant scoring, percentage calculation, correct/wrong/unanswered counts, and scorecard review.
  9. **Retake Exam Option**: Reset and retake the examination at any time.

---

## 🚀 How to Run Locally

### 1. Start Development Server
```bash
cd static-student-portal
npm run dev
```
Open **[https://localhost:5180/](https://localhost:5180/)** in your browser.

> **Note on HTTPS**: Vite uses self-signed certificates locally to allow browser permissions (camera, microphone, and fullscreen API). If your browser displays a security warning, click **Advanced** → **Proceed to localhost**.

### 2. Build for Production Deployment
```bash
npm run build
```
The static HTML/CSS/JS assets will be compiled into the `dist/` directory, ready to deploy to any static hosting provider (GitHub Pages, Vercel, Netlify, Cloudflare Pages, S3).

---

## 👤 Sample Demo Credentials

| Candidate Name | Aadhaar Number | Date of Birth (DOB) | Class |
|---|---|---|---|
| **Aarav Sharma** | `5432 1098 7654` | `15-08-2010` (`2010-08-15`) | 10th Standard |
| **Priya Patel** | `6543 2109 8765` | `22-04-2010` (`2010-04-22`) | 10th Standard |
| **Rohan Verma (Demo)** | `7654 3210 9876` | `10-12-2009` (`2009-12-10`) | 10th Standard |

*(You can also type any custom 12-digit Aadhaar Number and Date of Birth; the static mock engine will dynamically generate a candidate profile for you!)*


---

## 📚 Class-wise Question Papers

| Student class | Paper served |
|---|---|
| 6th | Class 6 English (15) + Science (15) + Mathematics (15) + Aptitude (15) = 60 Qs |
| 7th | Class 7 English (15) + Science (15) + Mathematics (15) + Aptitude (15) = 60 Qs |
| 8th | Class 8 English (15) + Science (15) + Mathematics (15) + Aptitude (15) = 60 Qs |
| 9th | Class 9 English (15) + Science (15) + Mathematics (15) + Aptitude (15) = 60 Qs |

- Questions live in `src/mock/questionBank.js`; `src/mock/examPapers.js` builds one isolated paper per class.
- The student's registered class decides the paper. Other classes (e.g. 10th) are denied access.
- Demo logins for each class are on the landing page (DEMO6 / DEMO / DEMO8 / DEMO9 style quick buttons).
