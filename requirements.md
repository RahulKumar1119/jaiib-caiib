# JAIIB-CAIIB Exam Prep Portal - Requirements Document

## Introduction

The JAIIB-CAIIB Exam Prep Portal is a full-stack web application designed to help bank officers prepare for IIBF (Indian Institute of Banking and Finance) certification exams. The platform provides an interactive exam engine with AI-powered tutoring, comprehensive score tracking, and personalized learning paths across multiple exam modules. Built with Next.js 15, AWS services (Lambda, DynamoDB, Bedrock), and Tailwind CSS, the portal enables scalable, multi-tenant access for banking institutions.

## Glossary

- **Bank_Officer**: An employee of a banking institution authorized to access the portal for exam preparation
- **IIBF**: Indian Institute of Banking and Finance, the regulatory body for banking certifications
- **JAIIB**: Junior Associate of the Indian Institute of Banking and Finance certification
- **JAIIB_Paper_I**: Indian Economy & Indian Financial System (IE & IFS)
- **JAIIB_Paper_II**: Principle and Practices of Banking (PPB)
- **JAIIB_Paper_III**: Accounting & Finance for Bankers (AFB)
- **JAIIB_Paper_IV**: Retail Banking & Wealth Management (RBWM)
- **Exam_Paper**: One of four distinct JAIIB papers (IE & IFS, PPB, AFB, RBWM)
- **Practice_Set**: A collection of 4 multiple-choice questions generated for a single practice session within a specific exam paper
- **MCQ**: Multiple-choice question with four options (A, B, C, D)
- **Score**: Numerical representation of performance (0-100) on a practice set or exam paper
- **AI_Tutor**: Bedrock-powered Claude 4.5 Haiku service providing detailed explanations
- **RBI_Norm**: Regulation or guideline issued by the Reserve Bank of India
- **IIBF_Norm**: Guideline or standard issued by the Indian Institute of Banking and Finance
- **Session_Timer**: Countdown mechanism tracking time remaining for a practice set
- **Dashboard**: User interface displaying performance metrics and learning progress across all four papers
- **Multi-tenant**: System architecture supporting multiple banking institutions with isolated data
- **Authentication**: Process of verifying Bank_Officer identity via email and password
- **Scoring_Engine**: System component calculating MCQ answers and generating scores
- **Content_Generation**: Process of generating MCQ questions using Claude 4.5 Haiku LLM

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

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a Bank_Officer, I want to securely log in with my email and password, so that I can access my personalized exam preparation environment.

#### Acceptance Criteria

1. WHEN a Bank_Officer provides valid email and password credentials, THE Authentication_Service SHALL verify credentials against the DynamoDB User table and return a session token
2. WHEN a Bank_Officer provides invalid credentials, THE Authentication_Service SHALL reject the login attempt and return an error message indicating "Invalid email or password"
3. WHEN a Bank_Officer attempts to access protected resources without a valid session token, THE Authorization_Service SHALL redirect to the login page
4. WHEN a Bank_Officer logs out, THE Authentication_Service SHALL invalidate the session token and clear client-side authentication state
5. THE Authentication_Service SHALL enforce password requirements of minimum 8 characters including uppercase, lowercase, and numeric characters
6. WHEN a Bank_Officer requests password reset, THE Authentication_Service SHALL send a time-limited reset link (valid for 24 hours) to the registered email address
7. THE Authentication_Service SHALL store passwords using bcrypt hashing with a minimum salt round of 10
8. WHEN a Bank_Officer's session expires after 30 minutes of inactivity, THE Authentication_Service SHALL automatically log out the user and require re-authentication

---

### Requirement 2: Multi-tenant User Isolation

**User Story:** As a system administrator, I want user data to be isolated by banking institution, so that data from different organizations remains completely separate and secure.

#### Acceptance Criteria

1. WHEN a Bank_Officer logs in, THE Authorization_Service SHALL associate the session with their organization's tenant ID stored in DynamoDB
2. WHEN a Bank_Officer queries their practice history, THE Data_Access_Layer SHALL filter results by tenant ID to return only their organization's data
3. WHEN a Bank_Officer attempts to access another organization's data through direct API calls, THE Authorization_Service SHALL deny access and return a 403 Forbidden error
4. THE DynamoDB schema SHALL use tenant ID as a partition key component in all user-related tables to enforce data isolation at the database level
5. WHEN generating reports or analytics, THE Analytics_Service SHALL aggregate data only within the requesting user's tenant boundary

---

### Requirement 3: Practice Set Generation for JAIIB Papers

**User Story:** As a Bank_Officer, I want to generate 4-question practice sets for each of the four JAIIB papers, so that I can practice efficiently for each distinct exam paper.

#### Acceptance Criteria

1. WHEN a Bank_Officer selects a JAIIB Paper (IE & IFS, PPB, AFB, or RBWM) and clicks "Start Practice", THE Exam_Engine SHALL generate a Practice_Set containing exactly 4 unique MCQs from the selected paper
2. WHEN a Practice_Set is generated, THE Exam_Engine SHALL ensure no MCQ appears twice in the same Practice_Set
3. WHEN a Bank_Officer generates multiple Practice_Sets for the same paper, THE Exam_Engine SHALL vary the MCQs across sessions (no MCQ shall repeat within 10 consecutive practice sets for the same paper)
4. WHEN a Practice_Set is generated, THE Exam_Engine SHALL randomly shuffle the order of answer options (A, B, C, D) for each MCQ to prevent pattern recognition
5. WHEN a Practice_Set is generated, THE Exam_Engine SHALL store the Practice_Set metadata (timestamp, paper, questions, correct answers) in DynamoDB for scoring and analytics
6. WHEN a Bank_Officer requests a Practice_Set, THE Exam_Engine SHALL respond within 500ms to ensure responsive user experience
7. WHEN a Bank_Officer generates a practice set, THE AI_Tutor SHALL use Claude 4.5 Haiku to generate MCQ content aligned with official JAIIB syllabus topics for the selected paper

---

### Requirement 4: Session Timer Management

**User Story:** As a Bank_Officer, I want a visible countdown timer during my practice session, so that I can manage my time effectively and simulate real exam conditions.

#### Acceptance Criteria

1. WHEN a Practice_Set is started, THE Session_Timer SHALL display a countdown starting from 10 minutes (600 seconds)
2. WHEN the Session_Timer reaches 5 minutes remaining, THE UI SHALL change the timer color to yellow to indicate time is running low
3. WHEN the Session_Timer reaches 1 minute remaining, THE UI SHALL change the timer color to red and display a warning message
4. WHEN the Session_Timer reaches 0 seconds, THE Exam_Engine SHALL automatically submit the Practice_Set with answers provided so far and display the score
5. WHEN a Bank_Officer manually submits before time expires, THE Session_Timer SHALL stop and the Practice_Set shall be scored immediately
6. THE Session_Timer SHALL update the display every 1 second with no perceptible lag (latency < 100ms)
7. IF the user's browser connection is lost during a practice session, THEN THE Exam_Engine SHALL preserve the session state and allow resumption within 15 minutes

---

### Requirement 5: MCQ Scoring Engine

**User Story:** As a Bank_Officer, I want my answers to be automatically scored and compared against correct answers, so that I receive immediate feedback on my performance.

#### Acceptance Criteria

1. WHEN a Bank_Officer submits a Practice_Set, THE Scoring_Engine SHALL compare each answer against the correct answer stored in DynamoDB
2. WHEN all 4 MCQs are answered correctly, THE Scoring_Engine SHALL calculate a score of 100
3. WHEN 3 MCQs are answered correctly, THE Scoring_Engine SHALL calculate a score of 75
4. WHEN 2 MCQs are answered correctly, THE Scoring_Engine SHALL calculate a score of 50
5. WHEN 1 MCQ is answered correctly, THE Scoring_Engine SHALL calculate a score of 25
6. WHEN 0 MCQs are answered correctly, THE Scoring_Engine SHALL calculate a score of 0
7. WHEN a Bank_Officer leaves an MCQ unanswered, THE Scoring_Engine SHALL treat it as an incorrect answer
8. WHEN scoring is complete, THE Scoring_Engine SHALL store the score, timestamp, module, and answer details in DynamoDB within 100ms
9. WHEN a score is calculated, THE Scoring_Engine SHALL return the score to the UI for immediate display

---

### Requirement 6: AI Tutor Integration with Claude 4.5 Haiku

**User Story:** As a Bank_Officer, I want detailed explanations for each MCQ citing relevant RBI and IIBF norms, so that I can understand the regulatory context and improve my knowledge.

#### Acceptance Criteria

1. WHEN a Bank_Officer views a Practice_Set result, THE AI_Tutor SHALL display an "Explain" button for each MCQ
2. WHEN a Bank_Officer clicks "Explain" for an MCQ, THE AI_Tutor SHALL invoke AWS Bedrock with Claude 4.5 Haiku to generate a detailed explanation
3. WHEN the AI_Tutor generates an explanation, THE response SHALL include the correct answer, reasoning, and citations to specific RBI_Norms or IIBF_Norms
4. WHEN the AI_Tutor generates an explanation, THE response SHALL be generated within 3 seconds and displayed to the user
5. WHEN a Bank_Officer requests an explanation, THE AI_Tutor SHALL include the question text, all four options, and the correct answer in the Bedrock prompt
6. WHEN the AI_Tutor receives a response from Bedrock, THE response SHALL be stored in DynamoDB for audit and analytics purposes
7. WHEN a Bank_Officer requests multiple explanations in a session, THE AI_Tutor SHALL handle concurrent requests without blocking other user interactions
8. IF Bedrock service is unavailable, THEN THE AI_Tutor SHALL display a user-friendly error message: "Explanation service temporarily unavailable. Please try again later."
9. WHEN generating MCQ content, THE AI_Tutor SHALL use Claude 4.5 Haiku to create questions aligned with official JAIIB syllabus topics for the selected paper

---

### Requirement 7: Score Dashboard and Performance Tracking

**User Story:** As a Bank_Officer, I want to view my performance metrics across all four JAIIB papers, so that I can identify areas for improvement and track my progress over time.

#### Acceptance Criteria

1. WHEN a Bank_Officer navigates to the Dashboard, THE Dashboard SHALL display the average score for each JAIIB Paper (IE & IFS, PPB, AFB, RBWM)
2. WHEN a Bank_Officer views the Dashboard, THE Dashboard SHALL display the total number of practice sets completed across all papers
3. WHEN a Bank_Officer views the Dashboard, THE Dashboard SHALL display a line chart showing score trends over the last 30 days for each paper
4. WHEN a Bank_Officer views the Dashboard, THE Dashboard SHALL display the highest score achieved in each paper
5. WHEN a Bank_Officer views the Dashboard, THE Dashboard SHALL display the most recent 10 practice set results with timestamps, papers, and scores
6. WHEN a Bank_Officer filters by JAIIB Paper, THE Dashboard SHALL update all metrics to show only data for the selected paper
7. WHEN a Bank_Officer views the Dashboard, THE Dashboard SHALL load all metrics within 1 second
8. WHEN a Bank_Officer's practice data is updated, THE Dashboard SHALL refresh metrics within 5 seconds of the update

---

### Requirement 8: Question Bank Management for JAIIB Papers

**User Story:** As a content administrator, I want to manage the MCQ question bank with proper versioning and validation aligned with JAIIB syllabus, so that the exam content remains accurate and up-to-date.

#### Acceptance Criteria

1. THE Question_Bank SHALL store MCQs with the following attributes: question_id, question_text, option_a, option_b, option_c, option_d, correct_answer, paper, difficulty_level, created_date, updated_date, version, syllabus_topic
2. WHEN a new MCQ is added to the Question_Bank, THE Question_Bank SHALL validate that exactly one correct answer is specified
3. WHEN a new MCQ is added to the Question_Bank, THE Question_Bank SHALL validate that the question_text is not empty and contains at least 10 characters
4. WHEN a new MCQ is added to the Question_Bank, THE Question_Bank SHALL validate that all four options are unique and non-empty
5. WHEN an MCQ is updated, THE Question_Bank SHALL increment the version number and preserve the previous version for audit purposes
6. WHEN a Practice_Set is generated, THE Exam_Engine SHALL use only MCQs marked as "active" in the Question_Bank
7. THE Question_Bank SHALL maintain a minimum of 40 MCQs per JAIIB Paper to ensure sufficient variety in Practice_Sets
8. WHEN MCQs are generated or added, THE system SHALL validate that questions align with official JAIIB syllabus topics for the respective paper

---

### Requirement 9: Error Handling and Resilience

**User Story:** As a Bank_Officer, I want the system to handle errors gracefully and provide clear feedback, so that I can understand what went wrong and take appropriate action.

#### Acceptance Criteria

1. IF a DynamoDB query fails, THEN THE Data_Access_Layer SHALL retry the operation up to 3 times with exponential backoff (1s, 2s, 4s) before returning an error
2. IF a Bedrock API call fails, THEN THE AI_Tutor SHALL return a user-friendly error message and log the failure for debugging
3. IF a Practice_Set generation fails, THEN THE Exam_Engine SHALL display an error message: "Unable to generate practice set. Please try again." and allow the user to retry
4. WHEN an unexpected error occurs, THE Error_Handler SHALL log the error with full stack trace, timestamp, user_id, and tenant_id to CloudWatch
5. WHEN a Bank_Officer encounters an error, THE UI SHALL display a clear, non-technical error message appropriate to the error type
6. IF the API Gateway receives a malformed request, THEN THE API_Gateway SHALL return a 400 Bad Request error with a descriptive error message

---

### Requirement 10: Performance and Scalability

**User Story:** As a system architect, I want the platform to handle concurrent users and maintain performance under load, so that the system remains responsive during peak usage times.

#### Acceptance Criteria

1. THE Exam_Engine SHALL support at least 100 concurrent Bank_Officers generating practice sets simultaneously without degradation
2. WHEN a Bank_Officer requests a Practice_Set, THE Exam_Engine SHALL respond within 500ms under normal load conditions
3. WHEN a Bank_Officer requests Dashboard metrics, THE Dashboard_Service SHALL respond within 1 second under normal load conditions
4. WHEN the AI_Tutor invokes Bedrock, THE response time SHALL not exceed 3 seconds including network latency
5. THE DynamoDB tables SHALL be configured with auto-scaling to handle traffic spikes up to 5x normal load
6. WHEN a Lambda function is invoked, THE cold start time SHALL not exceed 2 seconds
7. THE API_Gateway SHALL implement rate limiting of 100 requests per minute per Bank_Officer to prevent abuse

---

### Requirement 11: Data Security and Encryption

**User Story:** As a security officer, I want all sensitive data to be encrypted and transmitted securely, so that user information and exam data remain confidential.

#### Acceptance Criteria

1. WHEN data is transmitted between the client and API_Gateway, THE connection SHALL use TLS 1.2 or higher encryption
2. WHEN sensitive data (passwords, session tokens) is stored in DynamoDB, THE data SHALL be encrypted using AWS KMS with customer-managed keys
3. WHEN a Bank_Officer's personal information is stored, THE data SHALL be encrypted at rest in DynamoDB
4. WHEN audit logs are generated, THE logs SHALL be stored in CloudWatch with encryption enabled
5. WHEN a Bank_Officer's session token is created, THE token SHALL be cryptographically signed and include an expiration timestamp
6. THE API_Gateway SHALL validate all incoming requests for SQL injection, XSS, and other common attack vectors
7. WHEN a Bank_Officer's password is reset, THE reset link SHALL be single-use and expire after 24 hours

---

### Requirement 12: Audit and Compliance Logging

**User Story:** As a compliance officer, I want all user actions and system events to be logged for audit purposes, so that we can maintain regulatory compliance and investigate issues.

#### Acceptance Criteria

1. WHEN a Bank_Officer logs in, THE Audit_Logger SHALL record the login event with timestamp, user_id, tenant_id, and IP address
2. WHEN a Bank_Officer completes a Practice_Set, THE Audit_Logger SHALL record the completion event with timestamp, user_id, module, score, and answers
3. WHEN a Bank_Officer requests an AI explanation, THE Audit_Logger SHALL record the request with timestamp, user_id, question_id, and Bedrock response
4. WHEN an administrator modifies the Question_Bank, THE Audit_Logger SHALL record the modification with timestamp, admin_id, question_id, and change details
5. WHEN an error occurs, THE Audit_Logger SHALL record the error with timestamp, error_type, error_message, and affected user_id
6. THE Audit_Logger SHALL store all logs in CloudWatch with a retention period of 90 days
7. WHEN audit logs are queried, THE Audit_Logger SHALL support filtering by user_id, tenant_id, event_type, and date range

---

### Requirement 13: Responsive User Interface

**User Story:** As a Bank_Officer, I want the application to work seamlessly on desktop, tablet, and mobile devices, so that I can practice anytime, anywhere.

#### Acceptance Criteria

1. WHEN the application is viewed on a desktop (1920x1080), THE UI SHALL display all elements without horizontal scrolling
2. WHEN the application is viewed on a tablet (768x1024), THE UI SHALL adapt the layout to fit the screen and remain fully functional
3. WHEN the application is viewed on a mobile device (375x667), THE UI SHALL stack elements vertically and remain fully functional
4. WHEN a Bank_Officer interacts with the UI on a mobile device, THE response time to user actions SHALL not exceed 200ms
5. WHEN the application is loaded on a slow network (3G, 1.5 Mbps), THE initial page load time SHALL not exceed 5 seconds
6. THE UI SHALL use Tailwind CSS for consistent styling across all screen sizes
7. WHEN a Bank_Officer uses a screen reader, THE UI SHALL provide proper ARIA labels and semantic HTML for accessibility

---

### Requirement 14: Notification System

**User Story:** As a Bank_Officer, I want to receive notifications about my practice progress and important updates, so that I stay informed about my learning journey.

#### Acceptance Criteria

1. WHEN a Bank_Officer completes a Practice_Set with a score above 80, THE Notification_Service SHALL send an in-app notification: "Great job! You scored [score]%"
2. WHEN a Bank_Officer completes a Practice_Set with a score below 50, THE Notification_Service SHALL send an in-app notification: "Keep practicing! You scored [score]%. Review the explanations to improve."
3. WHEN a Bank_Officer has not practiced in 7 days, THE Notification_Service SHALL send an email reminder: "It's time to practice! Start a new practice session today."
4. WHEN new MCQs are added to the Question_Bank, THE Notification_Service SHALL send an in-app notification to all Bank_Officers: "New practice questions available!"
5. WHEN a Bank_Officer receives a notification, THE notification SHALL be displayed in the UI within 2 seconds
6. WHEN a Bank_Officer dismisses a notification, THE Notification_Service SHALL not display the same notification again

---

### Requirement 15: Analytics and Reporting

**User Story:** As a banking institution administrator, I want to view analytics and reports on user engagement and performance across all JAIIB papers, so that I can assess the effectiveness of the exam prep program.

#### Acceptance Criteria

1. WHEN an administrator accesses the Analytics dashboard, THE Analytics_Service SHALL display the total number of Bank_Officers who have logged in within the last 30 days
2. WHEN an administrator accesses the Analytics dashboard, THE Analytics_Service SHALL display the average score across all Bank_Officers for each JAIIB Paper (IE & IFS, PPB, AFB, RBWM)
3. WHEN an administrator accesses the Analytics dashboard, THE Analytics_Service SHALL display the number of practice sets completed per day for the last 30 days, broken down by paper
4. WHEN an administrator accesses the Analytics dashboard, THE Analytics_Service SHALL display the most frequently missed questions (bottom 10 by average score) for each paper
5. WHEN an administrator generates a report, THE Analytics_Service SHALL export data in CSV format within 10 seconds
6. WHEN analytics data is queried, THE Analytics_Service SHALL aggregate data only for the administrator's tenant
7. WHEN an administrator views analytics, THE data SHALL be updated daily at midnight UTC

---

## Non-Functional Requirements

### Performance Requirements

- Practice Set generation response time: < 500ms (p95)
- Dashboard metrics load time: < 1 second (p95)
- AI Tutor explanation generation: < 3 seconds (p95)
- UI interaction response time: < 200ms on mobile devices
- Initial page load time on 3G network: < 5 seconds
- Lambda cold start time: < 2 seconds

### Scalability Requirements

- Support minimum 100 concurrent Bank_Officers
- DynamoDB auto-scaling for 5x traffic spikes
- API Gateway rate limiting: 100 requests/minute per user
- Question Bank: minimum 40 MCQs per JAIIB Paper (160 total across 4 papers)

### Security Requirements

- TLS 1.2+ for all data transmission
- AWS KMS encryption for sensitive data at rest
- Password requirements: 8+ characters with uppercase, lowercase, numeric
- Session timeout: 30 minutes of inactivity
- Password reset link expiration: 24 hours
- Bcrypt hashing with minimum 10 salt rounds

### Availability Requirements

- System uptime target: 99.5%
- DynamoDB retry logic: 3 attempts with exponential backoff
- Graceful error handling for all service failures
- Audit logging retention: 90 days

### Compliance Requirements

- IIBF exam content accuracy and versioning
- RBI norm citations in AI explanations
- Multi-tenant data isolation
- Audit trail for all user actions and administrative changes
- GDPR-compliant data handling (if applicable)

---

## Dependencies and Constraints

### External Dependencies

- AWS Bedrock (Claude 4.5 Haiku) for AI explanations and MCQ content generation
- Official JAIIB syllabus documentation for content alignment
- IIBF exam content and RBI norms database
- Email service for password reset and notifications
- Banking institution's user directory (for initial user provisioning)

### Technical Constraints

- Next.js 15 with App Router for frontend
- AWS Lambda for backend services (TypeScript)
- DynamoDB for data persistence
- AWS CDK for infrastructure as code
- Tailwind CSS for styling
- API Gateway for request routing and rate limiting

### Organizational Constraints

- Multi-tenant architecture required for multiple banking institutions
- Data residency requirements (India region for AWS services)
- Compliance with IIBF and RBI guidelines
- Support for bank officer user base (estimated 1000-5000 users per institution)

---

## Success Metrics

1. **User Adoption**: 80% of invited Bank_Officers complete at least one practice set within 30 days
2. **Engagement**: Average Bank_Officer completes 3+ practice sets per week
3. **Performance Improvement**: Bank_Officers show average score improvement of 15+ points over 4 weeks
4. **System Reliability**: 99.5% uptime with < 0.1% error rate on practice set generation
5. **User Satisfaction**: Net Promoter Score (NPS) of 50+ from Bank_Officer surveys
6. **Content Quality**: 95%+ accuracy rating on AI explanations from subject matter experts
7. **Scalability**: System handles 100+ concurrent users without performance degradation
8. **Time to Value**: Bank_Officers can complete first practice set within 5 minutes of login

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026 | Requirements Team | Updated to align with official JAIIB syllabus (4 papers: IE & IFS, PPB, AFB, RBWM); switched to Claude 4.5 Haiku for MCQ generation and explanations |
| 1.0 | 2024 | Requirements Team | Initial comprehensive requirements document |
