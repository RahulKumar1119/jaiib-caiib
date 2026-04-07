# JAIIB-CAIIB Exam Prep Portal - Design Document

## Overview

The JAIIB-CAIIB Exam Prep Portal is a full-stack, multi-tenant web application enabling bank officers to practice for IIBF certification exams. The system generates randomized 4-question practice sets for each of the four JAIIB papers (IE & IFS, PPB, AFB, RBWM) with AI-powered explanations using Claude 4.5 Haiku, real-time scoring, and comprehensive performance tracking.

**Key Design Principles:**
- Multi-tenant isolation at database and application layers
- Serverless architecture for scalability and cost efficiency
- Real-time responsiveness with sub-500ms practice set generation
- Security-first approach with encryption, audit logging, and input validation
- Graceful degradation when external services (Bedrock) are unavailable
- Alignment with official JAIIB syllabus for all four papers

---

## Exam Structure

### JAIIB 2026 Exam Pattern Overview

The JAIIB examination consists of 4 papers, each held on different dates. The following table outlines the official exam structure:

| Paper | Subject | Questions | Total Marks | Duration | Cut-off |
|-------|---------|-----------|-------------|----------|---------|
| Paper I | Indian Economy & Indian Financial System (IE & IFS) | 100 | 100 | 2 hours | 50 marks |
| Paper II | Principles and Practices of Banking (PPB) | 100 | 100 | 2 hours | 50 marks |
| Paper III | Accounting & Financial Management for Bankers (AFM) | 100 | 100 | 2 hours | 50 marks |
| Paper IV | Retail Banking and Wealth Management (RBWM) | 100 | 100 | 2 hours | 50 marks |

### Marking Scheme (Per Paper)

Each paper consists of 100 questions with the following distribution:

- **50 questions of 0.5 marks each** = 25 marks
- **25 questions of 1 mark each** = 25 marks
- **25 questions of 2 marks each** = 50 marks
- **Total: 100 marks**

### Exam Mode and Language

- **Mode**: Online (Multiple Choice Questions)
- **Language Options**: Hindi or English (candidate's choice)
- **Negative Marking**: No negative marking for wrong answers
- **Unanswered Questions**: Treated as incorrect (0 marks)

### Passing Criteria

**Minimum Qualification:**
- Minimum 50 marks required in each subject (50% of 100)
- Candidates can qualify with 45 marks in each subject if aggregate across all subjects is 50% or higher in a single attempt
- Credits for passed subjects are retained until the allotted time for passing the examination expires

**First Class (60-65% Score):**
- Aggregate score of 60% or higher across all subjects
- Must pass all subjects in the FIRST PHYSICAL ATTEMPT

**First Class with Distinction (70%+ Score):**
- Aggregate score of 70% or higher
- Minimum 60% in each subject
- Must pass all subjects in the FIRST PHYSICAL ATTEMPT

### Attempt Rules

- Candidates can attempt each paper on different dates
- Credits for passed papers are retained for future attempts
- No limit specified on number of attempts per paper
- Each paper is conducted independently on different dates

---

## Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js 15 Frontend (App Router)                        │   │
│  │  - Login/Auth Pages                                      │   │
│  │  - Practice Set UI with Timer                            │   │
│  │  - Dashboard & Analytics                                 │   │
│  │  - Admin Question Management                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/TLS 1.2+
┌────────────────────────────▼────────────────────────────────────┐
│                    API Gateway Layer                             │
│  - Request routing & validation                                  │
│  - Rate limiting (100 req/min per user)                          │
│  - Authentication middleware                                     │
│  - CORS & security headers                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────────┐
│  Lambda Layer  │  │  Lambda Layer   │  │  Lambda Layer   │
│  - Auth        │  │  - Exam Engine  │  │  - Scoring      │
│  - Dashboard   │  │  - AI Tutor     │  │  - Audit Logs   │
│  - Admin Ops   │  │  - Notifications│  │  - Analytics    │
└───────┬────────┘  └────────┬────────┘  └──────┬──────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────────┐
│   DynamoDB     │  │  AWS Bedrock    │  │  CloudWatch     │
│   - Users      │  │  (Claude 3.5)   │  │  - Audit Logs   │
│   - Questions  │  │  - Explanations │  │  - Metrics      │
│   - Scores     │  │  - Caching      │  │  - Errors       │
│   - Audit Logs │  │                 │  │                 │
└────────────────┘  └─────────────────┘  └─────────────────┘
```

### Frontend Architecture (Next.js 15 App Router)

```
app/
├── layout.tsx                 # Root layout with auth provider
├── page.tsx                   # Landing page
├── (auth)/
│   ├── login/page.tsx        # Login form
│   ├── register/page.tsx      # Registration (if applicable)
│   └── reset-password/page.tsx
├── (protected)/
│   ├── layout.tsx            # Protected routes wrapper
│   ├── dashboard/
│   │   ├── page.tsx          # Main dashboard
│   │   └── analytics/page.tsx # Admin analytics
│   ├── practice/
│   │   ├── page.tsx          # Module selection
│   │   ├── [practiceSetId]/page.tsx  # Practice session
│   │   └── results/[resultId]/page.tsx
│   ├── admin/
│   │   ├── questions/page.tsx # Question management
│   │   └── users/page.tsx     # User management
│   └── profile/page.tsx       # User profile
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   └── refresh/route.ts
│   ├── practice-sets/
│   │   ├── route.ts           # POST to generate
│   │   └── [id]/route.ts      # GET, POST submit
│   ├── explanations/route.ts
│   ├── dashboard/route.ts
│   └── admin/questions/route.ts
└── components/
    ├── LoginForm.tsx
    ├── PracticeSetUI.tsx
    ├── Timer.tsx
    ├── ScoreDisplay.tsx
    ├── Dashboard.tsx
    └── shared/
```

### Backend Architecture (Lambda Functions)

```
Lambda Functions:
├── AuthenticationHandler
│   ├── POST /auth/login
│   ├── POST /auth/logout
│   ├── POST /auth/reset-password
│   └── POST /auth/verify-reset-token
├── ExamEngineHandler
│   ├── POST /practice-sets (generate)
│   ├── GET /practice-sets/{id}
│   ├── POST /practice-sets/{id}/submit
│   └── GET /practice-sets/{id}/resume
├── ScoringHandler
│   ├── POST /practice-sets/{id}/score
│   └── GET /scores/{userId}
├── AITutorHandler
│   ├── POST /explanations
│   └── GET /explanations/{id}
├── DashboardHandler
│   ├── GET /dashboard/metrics
│   ├── GET /dashboard/scores
│   └── GET /dashboard/trends
├── AdminHandler
│   ├── POST /questions
│   ├── PUT /questions/{id}
│   ├── DELETE /questions/{id}
│   └── GET /questions
├── AuditLogHandler
│   ├── POST /audit-logs
│   └── GET /audit-logs (with filtering)
└── NotificationHandler
    ├── POST /notifications/send
    └── POST /notifications/dismiss
```

---

## DynamoDB Schema Design

### Users Table

**Table Name:** `users`
**Partition Key:** `tenant_id#user_id` (composite)
**Sort Key:** None

| Attribute | Type | Description |
|-----------|------|-------------|
| tenant_id#user_id | String (PK) | Composite key: `{tenant_id}#{user_id}` |
| tenant_id | String (GSI1PK) | Organization identifier |
| user_id | String | Unique user identifier (UUID) |
| email | String (GSI2PK) | User email (unique per tenant) |
| password_hash | String | Bcrypt hash (salt rounds: 10) |
| full_name | String | User's full name |
| role | String | `officer`, `admin`, `super_admin` |
| status | String | `active`, `inactive`, `suspended` |
| created_at | Number | Unix timestamp |
| updated_at | Number | Unix timestamp |
| last_login | Number | Unix timestamp |
| session_token | String (encrypted) | JWT token |
| session_expires_at | Number | Token expiration timestamp |
| password_reset_token | String (encrypted) | Single-use reset token |
| password_reset_expires | Number | Reset token expiration |
| mfa_enabled | Boolean | Multi-factor authentication flag |
| preferences | Map | User preferences (theme, notifications) |

**GSI1:** `tenant_id-created_at-index` (for tenant user listing)
**GSI2:** `email-index` (for email-based lookups)
**TTL:** `session_expires_at` (auto-delete expired sessions)

---

### Questions Table

**Table Name:** `questions`
**Partition Key:** `paper#question_id`
**Sort Key:** `version`

| Attribute | Type | Description |
|-----------|------|-------------|
| paper#question_id | String (PK) | `{paper}#{question_id}` |
| paper | String (GSI1PK) | `JAIIB_IE_IFS`, `JAIIB_PPB`, `JAIIB_AFB`, `JAIIB_RBWM` |
| question_id | String | Unique question identifier |
| version | Number (SK) | Version number (incremented on updates) |
| question_text | String | MCQ question text (min 10 chars) |
| option_a | String | Option A text |
| option_b | String | Option B text |
| option_c | String | Option C text |
| option_d | String | Option D text |
| correct_answer | String | `A`, `B`, `C`, or `D` |
| difficulty_level | String | `easy`, `medium`, `hard` |
| status | String | `active`, `inactive`, `archived` |
| created_at | Number | Unix timestamp |
| updated_at | Number | Unix timestamp |
| created_by | String | Admin user ID |
| updated_by | String | Admin user ID |
| rbi_norms | List | References to RBI guidelines |
| iibf_norms | List | References to IIBF guidelines |
| syllabus_topic | String | Official JAIIB syllabus topic reference |
| explanation_template | String | Template for AI explanation |
| usage_count | Number | Times used in practice sets |
| avg_score | Number | Average score on this question |

**GSI1:** `paper-status-index` (for active questions by paper)
**GSI2:** `difficulty_level-paper-index` (for difficulty-based selection)
**TTL:** None

---

### PracticeSets Table

**Table Name:** `practice_sets`
**Partition Key:** `tenant_id#user_id`
**Sort Key:** `created_at` (descending)

| Attribute | Type | Description |
|-----------|------|-------------|
| tenant_id#user_id | String (PK) | `{tenant_id}#{user_id}` |
| practice_set_id | String (GSI1PK) | Unique practice set ID |
| tenant_id | String | Organization identifier |
| user_id | String | User identifier |
| paper | String | JAIIB paper (IE & IFS, PPB, AFB, RBWM) |
| created_at | Number (SK) | Creation timestamp |
| started_at | Number | Session start time |
| submitted_at | Number | Submission time |
| status | String | `in_progress`, `submitted`, `expired` |
| questions | List | Array of question IDs |
| user_answers | Map | `{question_id: answer}` |
| correct_answers | Map | `{question_id: correct_answer}` |
| score | Number | Calculated score (0-100) |
| time_taken | Number | Seconds spent |
| session_token | String | Session identifier for resumption |
| session_expires_at | Number | Session expiration time |
| ip_address | String | User's IP address |
| user_agent | String | Browser/device info |

**GSI1:** `practice_set_id-index` (for direct lookups)
**GSI2:** `tenant_id-created_at-index` (for user history)
**TTL:** `session_expires_at` (auto-delete expired sessions)

---

### Scores Table

**Table Name:** `scores`
**Partition Key:** `tenant_id#user_id`
**Sort Key:** `created_at` (descending)

| Attribute | Type | Description |
|-----------|------|-------------|
| tenant_id#user_id | String (PK) | `{tenant_id}#{user_id}` |
| score_id | String (GSI1PK) | Unique score ID |
| tenant_id | String | Organization identifier |
| user_id | String | User identifier |
| practice_set_id | String | Reference to practice set |
| paper | String | JAIIB paper (IE & IFS, PPB, AFB, RBWM) |
| score | Number | Score (0-100) |
| correct_count | Number | Number of correct answers |
| created_at | Number (SK) | Timestamp |
| time_taken | Number | Duration in seconds |
| difficulty_avg | Number | Average difficulty of questions |
| performance_trend | String | `improving`, `stable`, `declining` |

**GSI1:** `score_id-index` (for direct lookups)
**GSI2:** `paper-created_at-index` (for paper-specific analytics)
**TTL:** None

---

### AuditLogs Table

**Table Name:** `audit_logs`
**Partition Key:** `tenant_id`
**Sort Key:** `created_at` (descending)

| Attribute | Type | Description |
|-----------|------|-------------|
| tenant_id | String (PK) | Organization identifier |
| created_at | Number (SK) | Timestamp |
| audit_id | String (GSI1PK) | Unique audit log ID |
| event_type | String | `login`, `logout`, `practice_complete`, `explanation_requested`, `question_modified`, `error` |
| user_id | String | User identifier |
| resource_type | String | `user`, `question`, `practice_set`, `score` |
| resource_id | String | ID of affected resource |
| action | String | `create`, `read`, `update`, `delete` |
| changes | Map | Before/after values for updates |
| ip_address | String | User's IP address |
| user_agent | String | Browser/device info |
| status | String | `success`, `failure` |
| error_message | String | Error details if applicable |
| response_time_ms | Number | API response time |

**GSI1:** `audit_id-index` (for direct lookups)
**GSI2:** `user_id-created_at-index` (for user activity)
**GSI3:** `event_type-created_at-index` (for event filtering)
**TTL:** `created_at + 7776000` (90 days in seconds)

---

### ExplanationCache Table

**Table Name:** `explanation_cache`
**Partition Key:** `question_id`
**Sort Key:** None

| Attribute | Type | Description |
|-----------|------|-------------|
| question_id | String (PK) | Question identifier |
| explanation | String | Cached explanation from Bedrock |
| created_at | Number | Cache creation time |
| updated_at | Number | Last update time |
| usage_count | Number | Times this explanation was served |
| bedrock_model | String | Model used (claude-3-5-sonnet) |
| tokens_used | Number | Tokens consumed from Bedrock |

**TTL:** `created_at + 2592000` (30 days - refresh monthly)

---

## API Endpoints Design

### Authentication Endpoints

#### POST /auth/login

**Request:**
```json
{
  "email": "officer@bank.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "user_id": "user_123",
    "email": "officer@bank.com",
    "full_name": "John Officer",
    "role": "officer"
  },
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 1800,
  "refresh_token": "refresh_token_xyz"
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

#### POST /auth/register

**Request:**
```json
{
  "full_name": "John Officer",
  "email": "officer@bank.com",
  "password": "SecurePass123",
  "confirm_password": "SecurePass123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please log in with your credentials.",
  "user": {
    "user_id": "user_123",
    "email": "officer@bank.com",
    "full_name": "John Officer"
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "error": "Email already exists" | "Password does not meet requirements" | "Passwords do not match"
}
```

---

#### POST /auth/logout

**Request:**
```json
{
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### POST /auth/reset-password

**Request:**
```json
{
  "email": "officer@bank.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

---

#### POST /auth/verify-reset-token

**Request:**
```json
{
  "reset_token": "reset_token_abc123",
  "new_password": "NewSecurePass456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### Exam Engine Endpoints

#### POST /practice-sets

**Request:**
```json
{
  "paper": "JAIIB_IE_IFS",
  "difficulty": "mixed"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "practice_set": {
    "practice_set_id": "ps_abc123",
    "paper": "JAIIB_IE_IFS",
    "questions": [
      {
        "question_id": "q_001",
        "question_text": "What is the primary function of RBI?",
        "options": {
          "A": "Option A text",
          "B": "Option B text",
          "C": "Option C text",
          "D": "Option D text"
        },
        "order": ["B", "D", "A", "C"]
      }
    ],
    "time_limit": 600,
    "created_at": 1704067200,
    "session_token": "session_xyz"
  }
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Unable to generate practice set. Please try again."
}
```

---

#### GET /practice-sets/{id}

**Response (200 OK):**
```json
{
  "success": true,
  "practice_set": {
    "practice_set_id": "ps_abc123",
    "status": "in_progress",
    "time_remaining": 450,
    "questions": [...],
    "user_answers": {
      "q_001": "A",
      "q_002": null
    }
  }
}
```

---

#### POST /practice-sets/{id}/submit

**Request:**
```json
{
  "answers": {
    "q_001": "A",
    "q_002": "B",
    "q_003": "C",
    "q_004": "D"
  },
  "time_taken": 450
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "score": {
    "score_id": "score_123",
    "score": 75,
    "correct_count": 3,
    "total_questions": 4,
    "answers_detail": [
      {
        "question_id": "q_001",
        "user_answer": "A",
        "correct_answer": "A",
        "is_correct": true
      }
    ]
  }
}
```

---

### AI Tutor Endpoints

#### POST /explanations

**Request:**
```json
{
  "question_id": "q_001",
  "practice_set_id": "ps_abc123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "explanation": {
    "explanation_id": "exp_123",
    "question_id": "q_001",
    "correct_answer": "A",
    "explanation_text": "The correct answer is A because...",
    "rbi_norms": ["RBI Act 1934, Section 45"],
    "iibf_norms": ["IIBF Banking Regulation Guide"],
    "generated_at": 1704067200,
    "model": "claude-4-5-haiku"
  }
}
```

**Error (503 Service Unavailable):**
```json
{
  "success": false,
  "error": "Explanation service temporarily unavailable. Please try again later."
}
```

---

### Dashboard Endpoints

#### GET /dashboard/metrics

**Response (200 OK):**
```json
{
  "success": true,
  "metrics": {
    "total_practice_sets": 45,
    "average_score": 72.5,
    "paper_stats": {
      "JAIIB_IE_IFS": {
        "average_score": 75,
        "highest_score": 100,
        "practice_count": 12
      },
      "JAIIB_PPB": {
        "average_score": 70,
        "highest_score": 95,
        "practice_count": 11
      },
      "JAIIB_AFB": {
        "average_score": 72,
        "highest_score": 90,
        "practice_count": 11
      },
      "JAIIB_RBWM": {
        "average_score": 71,
        "highest_score": 88,
        "practice_count": 11
      }
    },
    "recent_scores": [
      {
        "score_id": "score_123",
        "paper": "JAIIB_IE_IFS",
        "score": 85,
        "created_at": 1704067200
      }
    ],
    "trend_data": [
      {
        "date": "2024-01-01",
        "average_score": 65
      }
    ]
  }
}
```

---

### Admin Endpoints

#### POST /admin/questions

**Request:**
```json
{
  "question_text": "What is the minimum capital requirement?",
  "option_a": "Option A",
  "option_b": "Option B",
  "option_c": "Option C",
  "option_d": "Option D",
  "correct_answer": "A",
  "paper": "JAIIB_IE_IFS",
  "difficulty_level": "medium",
  "syllabus_topic": "Economic Planning in India",
  "rbi_norms": ["RBI Act 1934"],
  "iibf_norms": ["IIBF Guide"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "question": {
    "question_id": "q_new_001",
    "version": 1,
    "created_at": 1704067200
  }
}
```

---

## Lambda Function Design

### AuthenticationHandler

**Responsibilities:**
- User registration with email, password, full name, and tenant ID
- Credential verification against DynamoDB
- JWT token generation and validation
- Password hashing with bcrypt (salt rounds: 10)
- Session management with 30-minute timeout
- Password reset token generation and validation
- Email uniqueness validation

**Key Functions:**

```typescript
async function handleRegister(fullName: string, email: string, tenantId: string, password: string): Promise<RegistrationResponse>
async function handleLogin(email: string, password: string, tenantId: string): Promise<LoginResponse>
async function handleLogout(sessionToken: string): Promise<void>
async function handlePasswordReset(email: string, tenantId: string): Promise<void>
async function verifyResetToken(token: string, newPassword: string): Promise<void>
async function validateSession(token: string): Promise<SessionData>
```

**Performance Targets:**
- Registration response: < 500ms
- Login response: < 500ms
- Token validation: < 100ms
- Password reset: < 1s

---

### ExamEngineHandler

**Responsibilities:**
- Generate 4-question practice sets with randomization for each JAIIB paper
- Ensure question variety (no repeats within 10 sets per paper)
- Shuffle answer options
- Store practice set metadata
- Handle session resumption
- Use Claude 4.5 Haiku for MCQ content generation aligned with JAIIB syllabus

**Key Functions:**

```typescript
async function generatePracticeSet(userId: string, paper: string): Promise<PracticeSet>
async function getPracticeSet(practiceSetId: string): Promise<PracticeSet>
async function resumePracticeSet(sessionToken: string): Promise<PracticeSet>
async function submitPracticeSet(practiceSetId: string, answers: Map<string, string>): Promise<void>
async function generateMCQContent(paper: string, topic: string): Promise<MCQ>
```

**Performance Targets:**
- Generation: < 500ms
- Retrieval: < 200ms
- Submission: < 300ms
- MCQ content generation: < 2s per question

---

### ScoringHandler

**Responsibilities:**
- Compare user answers against correct answers
- Calculate scores (25 points per correct answer)
- Store scores with metadata
- Track performance trends

**Key Functions:**

```typescript
async function calculateScore(practiceSetId: string, userAnswers: Map<string, string>): Promise<Score>
async function storeScore(score: Score): Promise<void>
async function getUserScores(userId: string, module?: string): Promise<Score[]>
```

**Scoring Logic:**
- 4/4 correct = 100
- 3/4 correct = 75
- 2/4 correct = 50
- 1/4 correct = 25
- 0/4 correct = 0
- Unanswered = 0

---

### AITutorHandler

**Responsibilities:**
- Invoke AWS Bedrock with Claude 4.5 Haiku to generate explanations
- Generate MCQ content aligned with JAIIB syllabus topics
- Generate explanations with RBI/IIBF norm citations
- Cache explanations for 30 days
- Handle Bedrock failures gracefully

**Key Functions:**

```typescript
async function generateExplanation(questionId: string, question: Question): Promise<Explanation>
async function getExplanation(questionId: string): Promise<Explanation>
async function cacheExplanation(explanation: Explanation): Promise<void>
async function generateMCQContent(paper: string, syllabusTopics: string[]): Promise<MCQ[]>
```

**Bedrock Prompt Template for Explanations:**
```
Question: {question_text}
Options:
A) {option_a}
B) {option_b}
C) {option_c}
D) {option_d}

Correct Answer: {correct_answer}

Please provide:
1. Why the correct answer is right
2. Why other options are incorrect
3. Relevant RBI norms and guidelines
4. Relevant IIBF standards
```

**Bedrock Prompt Template for MCQ Generation:**
```
Generate a multiple-choice question for the JAIIB exam.

Paper: {paper_name}
Syllabus Topic: {topic}
Difficulty Level: {difficulty}

Requirements:
- Question must be aligned with official JAIIB syllabus
- Include 4 unique options (A, B, C, D)
- Specify the correct answer
- Include relevant RBI/IIBF norm references
- Question text must be 10-200 characters

Format:
{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_answer": "A|B|C|D",
  "rbi_norms": [...],
  "iibf_norms": [...]
}
```

**Performance Targets:**
- Explanation generation: < 3s
- MCQ content generation: < 2s per question
- Cache hit: < 100ms
- Fallback error message: < 500ms

---

### DashboardHandler

**Responsibilities:**
- Aggregate user performance metrics
- Calculate module-specific statistics
- Generate trend data
- Support filtering by module

**Key Functions:**

```typescript
async function getMetrics(userId: string, module?: string): Promise<DashboardMetrics>
async function getTrendData(userId: string, days: number): Promise<TrendData[]>
async function getRecentScores(userId: string, limit: number): Promise<Score[]>
```

**Performance Targets:**
- Metrics retrieval: < 1s
- Trend calculation: < 800ms

---

### AuditLogHandler

**Responsibilities:**
- Log all user actions and system events
- Store logs in CloudWatch
- Support filtering and querying
- Maintain 90-day retention

**Key Functions:**

```typescript
async function logEvent(event: AuditEvent): Promise<void>
async function queryLogs(filters: LogFilters): Promise<AuditLog[]>
async function archiveLogs(olderThan: Date): Promise<void>
```

**Logged Events:**
- User login/logout
- Practice set completion
- Explanation requests
- Question modifications
- Errors and exceptions

---

## Frontend Component Structure

### Page Structure (App Router)

**Authentication Pages:**
- `/login` - Login form with email/password
- `/reset-password` - Password reset request
- `/reset-password/[token]` - Password reset form

**Protected Pages:**
- `/dashboard` - Main dashboard with metrics for all four JAIIB papers
- `/practice` - Paper selection (IE & IFS, PPB, AFB, RBWM)
- `/practice/[paper]/[practiceSetId]` - Active practice session for selected paper
- `/practice/results/[resultId]` - Score display and explanations
- `/admin/questions` - Question management (admin only)
- `/admin/analytics` - Analytics dashboard (admin only)

### Key Components

**LoginForm.tsx**
- Email and password inputs
- Form validation
- Error message display
- Loading state
- Redirect on success

**RegistrationForm.tsx**
- Full name, email, password, and confirm password inputs
- Real-time form validation with error display
- Password strength validation (8+ chars, uppercase, lowercase, numeric)
- Password matching validation
- Loading state with spinner during submission
- Redirect to login on successful registration
- Full accessibility support (ARIA labels, semantic HTML)
- Email uniqueness validation

**PracticeSetUI.tsx**
- Question display with options
- Answer selection (radio buttons)
- Navigation between questions
- Progress indicator
- Submit button

**Timer.tsx**
- Countdown display (MM:SS format)
- Color changes: green (>5min), yellow (5min), red (1min)
- Auto-submission on timeout
- Pause/resume capability

**ScoreDisplay.tsx**
- Score percentage
- Correct/incorrect count
- Answer review with explanations
- Performance feedback

**Dashboard.tsx**
- Module statistics cards
- Line chart for trends
- Recent scores table
- Module filter dropdown

**ExplanationPanel.tsx**
- Explanation text
- RBI/IIBF norm citations
- Loading state for Bedrock
- Error fallback message

### State Management

**Approach:** React Context API with custom hooks

**Key Contexts:**
- `AuthContext` - User authentication state
- `PracticeContext` - Current practice session state
- `DashboardContext` - Dashboard metrics and filters
- `NotificationContext` - Toast notifications

**Custom Hooks:**
- `useAuth()` - Authentication operations
- `usePracticeSet()` - Practice set operations
- `useDashboard()` - Dashboard data fetching
- `useTimer()` - Timer management

### API Client Integration

**Client Library:** Axios with interceptors

**Features:**
- Automatic token injection in headers
- Request/response logging
- Retry logic for failed requests
- Error handling and normalization
- Request cancellation on component unmount

```typescript
// Example API client
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('session_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Security Design

### Authentication Flow

```
1. User enters credentials
   ↓
2. Frontend sends HTTPS POST to /auth/login
   ↓
3. AuthenticationHandler validates credentials
   ↓
4. If valid:
   - Generate JWT token (signed with secret)
   - Set expiration to 30 minutes
   - Store session in DynamoDB
   - Return token to frontend
   ↓
5. Frontend stores token in secure HTTP-only cookie
   ↓
6. Subsequent requests include token in Authorization header
   ↓
7. API Gateway validates token before routing to Lambda
```

### Authorization Checks

**Tenant Isolation:**
- Extract tenant_id from JWT token
- All database queries include tenant_id in partition key
- API Gateway validates tenant_id matches authenticated user
- Cross-tenant access attempts return 403 Forbidden

**Role-Based Access Control:**
- `officer` - Can access practice sets and dashboard
- `admin` - Can manage questions and view analytics
- `super_admin` - Full system access

### Data Encryption

**In Transit:**
- TLS 1.2+ for all HTTPS connections
- API Gateway enforces HTTPS
- Certificate pinning for mobile clients (if applicable)

**At Rest:**
- AWS KMS encryption for DynamoDB tables
- Customer-managed keys for sensitive data
- Passwords encrypted with bcrypt (salt rounds: 10)
- Session tokens encrypted before storage

**Key Management:**
- KMS keys rotated annually
- Separate keys for different data classifications
- Access logs for key usage

### Input Validation and Sanitization

**Frontend Validation:**
- Email format validation
- Password strength requirements
- Question text length validation
- Option uniqueness validation

**Backend Validation:**
- Whitelist allowed characters
- SQL injection prevention (parameterized queries)
- XSS prevention (HTML escaping)
- CSRF token validation
- Rate limiting per user

**API Gateway Validation:**
- Request schema validation
- Content-type verification
- Payload size limits
- Header validation

---

## Error Handling Strategy

### Retry Logic

**DynamoDB Failures:**
```
Attempt 1: Immediate retry
Attempt 2: Wait 1 second, retry
Attempt 3: Wait 2 seconds, retry
Attempt 4: Wait 4 seconds, retry
After 3 failures: Return error to user
```

**Bedrock Failures:**
```
Attempt 1: Immediate retry
Attempt 2: Wait 2 seconds, retry
After 2 failures: Return cached explanation or error message
```

### Graceful Degradation

**Bedrock Unavailable:**
- Display error message: "Explanation service temporarily unavailable. Please try again later."
- Offer to retry later
- Log failure for monitoring

**DynamoDB Throttling:**
- Implement exponential backoff
- Queue requests if necessary
- Return 503 Service Unavailable if queue full

### Error Messages

**User-Friendly Messages:**
- "Invalid email or password" (don't reveal which field is wrong)
- "Unable to generate practice set. Please try again."
- "Your session has expired. Please log in again."
- "An error occurred. Please contact support."

**Technical Logging:**
- Full stack traces in CloudWatch
- Request/response payloads
- User context (user_id, tenant_id)
- Timestamp and duration

---

## Performance Optimization

### Caching Strategy

**CloudFront (CDN):**
- Cache static assets (JS, CSS, images)
- TTL: 1 day for versioned assets
- Invalidate on deployment

**DynamoDB Caching:**
- DAX (DynamoDB Accelerator) for frequently accessed data
- Cache questions by module
- Cache user preferences
- TTL: 5 minutes

**Application-Level Caching:**
- Cache explanations for 30 days
- Cache module statistics for 1 hour
- Cache user session data in memory

### Database Query Optimization

**Indexes:**
- GSI for tenant-based queries
- GSI for module-based queries
- Sort key for time-based queries

**Query Patterns:**
- Use partition key + sort key for efficient retrieval
- Batch operations where possible
- Avoid full table scans

**Connection Pooling:**
- Reuse database connections
- Configure connection timeout
- Monitor connection pool metrics

### Lambda Optimization

**Memory Allocation:**
- AuthenticationHandler: 512 MB
- ExamEngineHandler: 1024 MB
- ScoringHandler: 512 MB
- AITutorHandler: 1024 MB
- DashboardHandler: 512 MB

**Cold Start Reduction:**
- Use Lambda layers for dependencies
- Minimize package size
- Provisioned concurrency for critical functions
- Keep functions warm with scheduled invocations

**Execution Time:**
- Async operations where possible
- Parallel processing for independent tasks
- Early returns to avoid unnecessary processing

### Frontend Optimization

**Code Splitting:**
- Separate bundles for authenticated/unauthenticated pages
- Lazy load dashboard components
- Dynamic imports for heavy libraries

**Image Optimization:**
- WebP format with fallbacks
- Responsive images with srcset
- Lazy loading for below-fold images

**Bundle Size:**
- Tree-shaking unused code
- Minification and compression
- Remove unused dependencies

---

## Scalability Considerations

### DynamoDB Auto-Scaling

**Read Capacity:**
- Target utilization: 70%
- Scale up: Add 100 RCU when utilization > 70%
- Scale down: Remove 100 RCU when utilization < 30%
- Max capacity: 40,000 RCU

**Write Capacity:**
- Target utilization: 70%
- Scale up: Add 100 WCU when utilization > 70%
- Scale down: Remove 100 WCU when utilization < 30%
- Max capacity: 40,000 WCU

### Lambda Concurrency

**Reserved Concurrency:**
- AuthenticationHandler: 100
- ExamEngineHandler: 200
- ScoringHandler: 100
- AITutorHandler: 50
- DashboardHandler: 50

**Unreserved Concurrency:** 1000 (account limit)

### API Gateway Throttling

**Rate Limits:**
- 100 requests per minute per user
- 10,000 requests per second per account
- Burst capacity: 5,000 requests

**Throttling Response:**
```json
{
  "message": "Rate limit exceeded. Please try again later."
}
```

### Multi-Region Considerations

**Current:** Single region (India - ap-south-1)

**Future Expansion:**
- Read replicas in other regions
- Global secondary indexes
- Cross-region failover
- Data residency compliance

---

## Deployment Architecture

### AWS CDK Stack Structure

```typescript
// Main stack
class JaiibCaiibStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // VPC and networking
    const vpc = new ec2.Vpc(this, 'VPC');
    
    // DynamoDB tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {...});
    const questionsTable = new dynamodb.Table(this, 'QuestionsTable', {...});
    const practiceSetsTable = new dynamodb.Table(this, 'PracticeSetsTable', {...});
    const scoresTable = new dynamodb.Table(this, 'ScoresTable', {...});
    const auditLogsTable = new dynamodb.Table(this, 'AuditLogsTable', {...});
    
    // Lambda functions
    const authHandler = new lambda.Function(this, 'AuthHandler', {...});
    const examHandler = new lambda.Function(this, 'ExamHandler', {...});
    const scoringHandler = new lambda.Function(this, 'ScoringHandler', {...});
    const aiTutorHandler = new lambda.Function(this, 'AITutorHandler', {...});
    const dashboardHandler = new lambda.Function(this, 'DashboardHandler', {...});
    
    // API Gateway
    const api = new apigateway.RestApi(this, 'API', {...});
    
    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {...});
    
    // CloudWatch alarms
    new cloudwatch.Alarm(this, 'HighErrorRate', {...});
    new cloudwatch.Alarm(this, 'HighLatency', {...});
  }
}
```

### Environment Configuration

**Development:**
- DynamoDB local or on-demand
- Lambda memory: 512 MB
- API Gateway throttling: 1000 req/min
- Logging level: DEBUG

**Staging:**
- DynamoDB provisioned (100 RCU/WCU)
- Lambda memory: 1024 MB
- API Gateway throttling: 5000 req/min
- Logging level: INFO

**Production:**
- DynamoDB auto-scaling
- Lambda memory: 1024-2048 MB
- API Gateway throttling: 10000 req/min
- Logging level: WARN
- Multi-AZ deployment
- Backup and disaster recovery

### CI/CD Pipeline

**GitHub Actions Workflow:**
1. Code push to main branch
2. Run tests and linting
3. Build Docker images
4. Deploy to staging
5. Run integration tests
6. Manual approval
7. Deploy to production
8. Run smoke tests

**Deployment Steps:**
```bash
# Build
npm run build

# Test
npm run test
npm run test:integration

# Deploy
cdk deploy --require-approval never

# Verify
npm run smoke-tests
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Token Validity

For any valid user credentials, after successful login, the returned session token must be valid for subsequent authenticated requests and must expire after 30 minutes of inactivity.

**Validates: Requirements 1.1, 1.8**

### Property 2: Tenant Data Isolation

For any two users from different tenants, querying practice history or scores must return only data belonging to their respective tenant, never data from other tenants.

**Validates: Requirements 2.2, 2.3**

### Property 3: Practice Set Uniqueness per Paper

For any user and JAIIB paper, generating 10 consecutive practice sets must result in no question appearing in more than one set.

**Validates: Requirements 3.3**

### Property 4: Answer Option Shuffling

For any practice set generated multiple times for the same question, the order of answer options (A, B, C, D) must vary across generations.

**Validates: Requirements 3.4**

### Property 5: Score Calculation Determinism

For any set of user answers submitted to the scoring engine, the calculated score must be deterministic: score = (correct_count / 4) * 100, where unanswered questions count as incorrect.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

### Property 6: Session Resumption Consistency

For any practice set interrupted and resumed within 15 minutes, the resumed session must contain the same questions and previously submitted answers.

**Validates: Requirements 4.7**

### Property 7: Explanation Content Completeness

For any explanation generated by the AI Tutor, the response must include the correct answer, reasoning, and at least one citation to RBI or IIBF norms.

**Validates: Requirements 6.3, 6.5**

### Property 8: Dashboard Metric Accuracy

For any user, the dashboard average score for each JAIIB paper must equal the arithmetic mean of all their practice set scores for that paper, and the total practice sets count must match the number of submitted practice sets across all four papers.

**Validates: Requirements 7.1, 7.2**

### Property 9: Question Bank Validation

For any new question added to the Question Bank, exactly one correct answer must be specified, question text must be at least 10 characters, and all four options must be unique and non-empty.

**Validates: Requirements 8.2, 8.3, 8.4**

### Property 10: Question Versioning

For any question updated in the Question Bank, the version number must increment by 1, and the previous version must remain accessible in the database.

**Validates: Requirements 8.5**

### Property 11: Active Question Filtering per Paper

For any practice set generated for a JAIIB paper, all questions in the set must have status = "active" in the Question Bank and must belong to the selected paper.

**Validates: Requirements 8.6**

### Property 12: JAIIB Syllabus Alignment

For any MCQ generated or added to the Question Bank, the question must be aligned with official JAIIB syllabus topics for the respective paper (IE & IFS, PPB, AFB, or RBWM).

**Validates: Requirements 3.7, 8.8**

For any DynamoDB operation that fails, the system must retry up to 3 times with exponential backoff (1s, 2s, 4s) before returning an error to the user.

**Validates: Requirements 9.1**

### Property 13: Bedrock Failure Handling

For any Bedrock API call that fails, the system must return a user-friendly error message and log the failure without crashing.

**Validates: Requirements 6.8, 9.2**

### Property 14: Password Reset Token Security

For any password reset token generated, the token must be single-use and expire after 24 hours.

**Validates: Requirements 1.6, 11.7**

### Property 15: Audit Log Completeness

For any user action (login, practice completion, explanation request), an audit log entry must be created with timestamp, user_id, tenant_id, and action details.

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 16: Encryption at Rest

For any sensitive data stored in DynamoDB (passwords, session tokens), the data must be encrypted using AWS KMS with customer-managed keys.

**Validates: Requirements 11.2, 11.3**

### Property 17: TLS Encryption in Transit

For any data transmitted between client and API Gateway, the connection must use TLS 1.2 or higher.

**Validates: Requirements 11.1**

### Property 18: Rate Limiting Enforcement

For any user, the system must limit requests to 100 per minute, returning 429 Too Many Requests for excess requests.

**Validates: Requirements 10.7**

### Property 19: Notification Delivery Timing

For any notification triggered (high score, low score, inactivity reminder), the notification must be displayed in the UI within 2 seconds.

**Validates: Requirements 14.5**

### Property 20: Notification Dismissal Persistence

For any notification dismissed by a user, the same notification must not be displayed again in subsequent sessions.

**Validates: Requirements 14.6**

---

## Testing Strategy

### Dual Testing Approach

The system employs both unit testing and property-based testing to ensure comprehensive correctness:

**Unit Tests:**
- Specific examples and edge cases
- Integration points between components
- Error conditions and failure scenarios
- UI component rendering and interactions

**Property-Based Tests:**
- Universal properties across all inputs
- Comprehensive input coverage through randomization
- Invariant preservation across operations
- Round-trip properties for serialization

### Unit Testing

**Framework:** Jest (for TypeScript/Node.js)

**Test Coverage Targets:**
- Authentication: 95%
- Scoring Engine: 100%
- Dashboard calculations: 95%
- Error handling: 90%

**Example Unit Tests:**
```typescript
describe('ScoringEngine', () => {
  it('should calculate 100 for 4 correct answers', () => {
    const score = calculateScore(4, 0);
    expect(score).toBe(100);
  });
  
  it('should treat unanswered questions as incorrect', () => {
    const answers = { q1: 'A', q2: null, q3: 'C', q4: 'D' };
    const score = calculateScore(answers, correctAnswers);
    expect(score).toBe(75); // 3/4 correct
  });
});
```

### Property-Based Testing

**Framework:** fast-check (for TypeScript)

**Configuration:**
- Minimum 100 iterations per property test
- Seed-based reproducibility
- Shrinking for minimal failing examples

**Example Property Tests:**

```typescript
import fc from 'fast-check';

// Property 1: Score Calculation Determinism
test('Score calculation is deterministic', () => {
  fc.assert(
    fc.property(
      fc.array(fc.oneof(
        fc.constant('A'),
        fc.constant('B'),
        fc.constant('C'),
        fc.constant('D'),
        fc.constant(null)
      ), { minLength: 4, maxLength: 4 }),
      (answers) => {
        const score1 = calculateScore(answers, correctAnswers);
        const score2 = calculateScore(answers, correctAnswers);
        return score1 === score2;
      }
    ),
    { numRuns: 100 }
  );
});

// Property 2: Tenant Isolation
test('Queries filter by tenant_id', () => {
  fc.assert(
    fc.property(
      fc.uuid(),
      fc.uuid(),
      (tenantId1, tenantId2) => {
        fc.pre(tenantId1 !== tenantId2);
        const user1Data = queryUserData(tenantId1);
        const user2Data = queryUserData(tenantId2);
        return !user1Data.some(item => item.tenant_id === tenantId2);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 3: Practice Set Uniqueness per Paper
test('No question repeats in 10 consecutive sets for same paper', () => {
  fc.assert(
    fc.property(
      fc.uuid(),
      fc.oneof(
        fc.constant('JAIIB_IE_IFS'),
        fc.constant('JAIIB_PPB'),
        fc.constant('JAIIB_AFB'),
        fc.constant('JAIIB_RBWM')
      ),
      (userId, paper) => {
        const sets = Array.from({ length: 10 }, () =>
          generatePracticeSet(userId, paper)
        );
        const allQuestions = sets.flatMap(s => s.questions);
        const uniqueQuestions = new Set(allQuestions.map(q => q.question_id));
        return uniqueQuestions.size === allQuestions.length;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Scope:**
- End-to-end practice set generation and scoring
- Authentication flow with session management
- Dashboard metric aggregation
- Bedrock integration with fallback

**Tools:** Supertest (for API testing)

```typescript
describe('Practice Set Flow', () => {
  it('should generate, submit, and score a practice set', async () => {
    // Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'test@bank.com', password: 'Pass123' });
    
    const token = loginRes.body.session_token;
    
    // Generate practice set
    const genRes = await request(app)
      .post('/practice-sets')
      .set('Authorization', `Bearer ${token}`)
      .send({ module: 'JAIIB_LEGAL' });
    
    const practiceSetId = genRes.body.practice_set.practice_set_id;
    
    // Submit answers
    const submitRes = await request(app)
      .post(`/practice-sets/${practiceSetId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D' } });
    
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.score).toBeDefined();
  });
});
```

### Performance Testing

**Tools:** Apache JMeter or k6

**Scenarios:**
- 100 concurrent users generating practice sets
- Dashboard metrics retrieval under load
- Bedrock explanation generation latency
- Database query performance

**Success Criteria:**
- Practice set generation: p95 < 500ms
- Dashboard load: p95 < 1s
- Bedrock explanation: p95 < 3s
- No errors under 100 concurrent users

### Security Testing

**Tools:** OWASP ZAP, Burp Suite

**Test Cases:**
- SQL injection attempts
- XSS payload injection
- CSRF token validation
- Cross-tenant access attempts
- Rate limiting enforcement
- Password reset token reuse

---

## Error Handling and Resilience

### Error Categories and Responses

**Authentication Errors (4xx):**
- 400 Bad Request: Malformed login request
- 401 Unauthorized: Invalid credentials
- 403 Forbidden: Cross-tenant access attempt
- 429 Too Many Requests: Rate limit exceeded

**Server Errors (5xx):**
- 500 Internal Server Error: Unexpected error
- 503 Service Unavailable: Bedrock unavailable, DynamoDB throttled

### Retry Strategies

**DynamoDB Transient Failures:**
```
Attempt 1: Immediate
Attempt 2: Wait 1s + jitter (0-100ms)
Attempt 3: Wait 2s + jitter (0-100ms)
Attempt 4: Wait 4s + jitter (0-100ms)
Max retries: 3
```

**Bedrock API Failures:**
```
Attempt 1: Immediate
Attempt 2: Wait 2s + jitter (0-500ms)
Max retries: 2
Fallback: Return cached explanation or error message
```

**Lambda Invocation Failures:**
```
Automatic retry: AWS Lambda retries failed invocations
Max retries: 2 (for asynchronous invocations)
Dead-letter queue: Failed events sent to SQS for manual review
```

### Circuit Breaker Pattern

**Bedrock Service:**
- Track failure rate over 5-minute window
- If failure rate > 50%, open circuit
- Return error message without calling Bedrock
- Half-open state: Try 1 request every 30 seconds
- Close circuit when success rate > 90%

---

## Monitoring and Observability

### CloudWatch Metrics

**Application Metrics:**
- Practice set generation latency (p50, p95, p99)
- Scoring engine latency
- Dashboard load time
- Bedrock explanation latency
- Error rate by endpoint
- User authentication success rate

**Infrastructure Metrics:**
- Lambda invocation count and duration
- DynamoDB read/write capacity utilization
- API Gateway request count and latency
- CloudFront cache hit ratio

### CloudWatch Alarms

**Critical Alarms:**
- Error rate > 1% for 5 minutes
- Practice set generation latency p95 > 1s
- DynamoDB throttling detected
- Bedrock service unavailable for > 5 minutes
- Lambda cold start time > 3s

**Warning Alarms:**
- Error rate > 0.5% for 10 minutes
- Dashboard load time p95 > 2s
- DynamoDB capacity utilization > 80%

### Logging Strategy

**Log Levels:**
- ERROR: Exceptions, failed operations, security violations
- WARN: Degraded performance, retries, circuit breaker state changes
- INFO: User actions, successful operations, deployments
- DEBUG: Request/response payloads, internal state changes (dev only)

**Log Fields:**
- timestamp (ISO 8601)
- level (ERROR, WARN, INFO, DEBUG)
- service (auth, exam, scoring, etc.)
- user_id (if applicable)
- tenant_id (if applicable)
- request_id (for tracing)
- message
- stack_trace (for errors)
- duration_ms (for operations)

---

## Data Consistency and Integrity

### Eventual Consistency Model

**Strong Consistency:**
- User authentication (immediate)
- Practice set submission (immediate)
- Score calculation (immediate)

**Eventual Consistency:**
- Dashboard metrics (updated within 5 seconds)
- Analytics aggregation (updated daily)
- Audit log queries (eventual)

### Transaction Handling

**DynamoDB Transactions:**
- Used for multi-item updates (e.g., score + audit log)
- Atomic: All-or-nothing semantics
- Rollback on failure

**Example Transaction:**
```typescript
const transaction = {
  TransactItems: [
    {
      Put: {
        TableName: 'scores',
        Item: { score_id, user_id, score, ... }
      }
    },
    {
      Put: {
        TableName: 'audit_logs',
        Item: { audit_id, user_id, event_type: 'practice_complete', ... }
      }
    }
  ]
};
```

### Data Validation

**Input Validation:**
- Email format: RFC 5322 compliant
- Password: 8+ chars, uppercase, lowercase, numeric
- Question text: 10-1000 characters
- Options: Non-empty, unique, 1-500 characters each

**Output Validation:**
- Score: 0-100 integer
- Timestamp: Valid Unix timestamp
- UUID: Valid v4 format

---

## Compliance and Audit

### Regulatory Requirements

**IIBF Compliance:**
- Accurate exam content
- Proper question versioning
- Audit trail for content changes

**RBI Compliance:**
- Data security standards
- Encryption requirements
- Audit logging

**GDPR (if applicable):**
- Data retention policies
- Right to be forgotten
- Data portability

### Audit Trail

**Events Logged:**
- User login/logout with IP address
- Practice set completion with answers
- Explanation requests
- Question modifications
- Admin actions
- System errors

**Retention:**
- 90 days in CloudWatch
- 1 year in S3 (archived)
- Immutable audit logs

---

## Disaster Recovery and Business Continuity

### Backup Strategy

**DynamoDB:**
- Point-in-time recovery enabled
- Daily snapshots to S3
- Cross-region replication (future)

**Application Code:**
- Git repository with version history
- Tagged releases for production versions
- Infrastructure as Code in CDK

### Recovery Procedures

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 15 minutes

**Failure Scenarios:**

1. **Single Lambda Function Failure:**
   - Automatic retry by API Gateway
   - Fallback to cached response if available
   - Alert operations team

2. **DynamoDB Unavailability:**
   - Retry with exponential backoff
   - Return 503 Service Unavailable
   - Failover to read replica (future)

3. **Bedrock Service Unavailability:**
   - Return cached explanation
   - Display error message to user
   - Continue without explanations

4. **Regional Outage:**
   - Failover to secondary region (future)
   - Manual intervention required
   - Estimated recovery: 30-60 minutes

---

## Future Enhancements

### Planned Features

1. **Multi-Region Deployment:**
   - Active-active setup in multiple AWS regions
   - Global load balancing
   - Cross-region replication

2. **Advanced Analytics:**
   - Machine learning for performance prediction
   - Personalized learning paths
   - Adaptive difficulty adjustment

3. **Mobile Application:**
   - Native iOS/Android apps
   - Offline practice mode
   - Push notifications

4. **Social Features:**
   - Peer comparison (anonymized)
   - Study groups
   - Discussion forums

5. **Integration with IIBF:**
   - Real exam registration
   - Score submission to IIBF
   - Certificate generation

---

## Design Decisions and Rationales

### Why Serverless (Lambda)?

**Rationale:**
- Auto-scaling without manual intervention
- Pay-per-use pricing model
- Reduced operational overhead
- Built-in monitoring and logging

**Trade-offs:**
- Cold start latency (mitigated with provisioned concurrency)
- Execution time limits (15 minutes sufficient for our use case)
- Vendor lock-in (acceptable for this project)

### Why DynamoDB?

**Rationale:**
- Multi-tenant isolation via partition keys
- Auto-scaling for variable workloads
- Global secondary indexes for flexible queries
- Built-in encryption and compliance

**Trade-offs:**
- Limited query flexibility (mitigated with GSIs)
- Eventual consistency (acceptable for analytics)
- Higher cost at scale (offset by auto-scaling efficiency)

### Why Next.js 15 App Router?

**Rationale:**
- Server components for better performance
- Built-in API routes
- Automatic code splitting
- Excellent TypeScript support

**Trade-offs:**
- Newer framework (less community resources)
- Learning curve for App Router
- Potential breaking changes in future versions

### Why AWS Bedrock with Claude 4.5 Haiku?

**Rationale:**
- Managed service (no infrastructure management)
- Access to Claude 4.5 Haiku (optimized for fast, cost-effective inference)
- Excellent performance for MCQ generation and explanations
- Built-in safety features
- Easy integration with Lambda
- Lower latency and cost compared to larger models

**Trade-offs:**
- Vendor lock-in
- Potential latency (3s acceptable for explanations, 2s for MCQ generation)
- Cost per token (mitigated with caching and model efficiency)

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026 | Design Team | Updated to align with official JAIIB syllabus (4 papers: IE & IFS, PPB, AFB, RBWM); switched to Claude 4.5 Haiku for MCQ generation and explanations |
| 1.0 | 2024 | Design Team | Initial comprehensive design document |

---

## Appendix: Configuration Examples

### Environment Variables

```bash
# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=1800
BCRYPT_SALT_ROUNDS=10

# AWS Services
AWS_REGION=ap-south-1
DYNAMODB_ENDPOINT=https://dynamodb.ap-south-1.amazonaws.com
BEDROCK_MODEL_ID=anthropic.claude-4-5-haiku-20250514-v1:0

# API Configuration
API_RATE_LIMIT=100
API_RATE_LIMIT_WINDOW=60000
API_TIMEOUT=10000

# Feature Flags
ENABLE_BEDROCK=true
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true

# Logging
LOG_LEVEL=INFO
CLOUDWATCH_LOG_GROUP=/aws/lambda/jaiib-caiib
```

### DynamoDB Table Creation (CDK)

```typescript
const usersTable = new dynamodb.Table(this, 'UsersTable', {
  tableName: 'users',
  partitionKey: { name: 'tenant_id#user_id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  pointInTimeRecovery: true,
  ttl: {
    attribute: 'session_expires_at',
    enabled: true,
  },
  globalSecondaryIndexes: [
    {
      indexName: 'tenant_id-created_at-index',
      partitionKey: { name: 'tenant_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    },
    {
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    },
  ],
});
```

### Lambda Function Configuration (CDK)

```typescript
const authHandler = new lambda.Function(this, 'AuthHandler', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('dist/auth-handler'),
  memorySize: 512,
  timeout: cdk.Duration.seconds(30),
  environment: {
    JWT_SECRET: process.env.JWT_SECRET!,
    USERS_TABLE: usersTable.tableName,
  },
  layers: [dependenciesLayer],
  reservedConcurrentExecutions: 100,
  logRetention: logs.RetentionDays.ONE_MONTH,
});

usersTable.grantReadWriteData(authHandler);
```

