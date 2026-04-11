# Practice Set Components

Complete UI components for the JAIIB-CAIIB practice session flow.

## Components Overview

### Timer Component
Displays a countdown timer with color-coded warnings.

**Props:**
- `initialSeconds` (number) - Initial time in seconds (default: 600 for 10 minutes)
- `onTimeUp` (function) - Callback when timer reaches 0
- `isActive` (boolean) - Whether timer is running (default: true)

**Features:**
- Real-time countdown display (MM:SS format)
- Color changes: Normal → Warning (5 min) → Critical (1 min)
- Animations for visual feedback
- Responsive design

**Usage:**
```tsx
<Timer
  initialSeconds={600}
  onTimeUp={() => handleSubmit()}
  isActive={true}
/>
```

---

### Question Component
Displays a single MCQ with options and answer selection.

**Props:**
- `question` (QuestionData) - Question object with text and options
- `questionNumber` (number) - Current question number
- `totalQuestions` (number) - Total questions in set
- `selectedAnswer` (string | null) - Currently selected answer
- `onAnswerSelect` (function) - Callback when answer is selected
- `isReview` (boolean) - Whether in review mode (default: false)
- `correctAnswer` (string) - Correct answer (for review mode)
- `userAnswer` (string) - User's answer (for review mode)

**Features:**
- Clear question text display
- Four option buttons with visual feedback
- Selected answer highlighting
- Review mode with correct/incorrect indicators
- Accessibility features (ARIA labels, semantic HTML)

**Usage:**
```tsx
<Question
  question={questionData}
  questionNumber={1}
  totalQuestions={4}
  selectedAnswer={selectedAnswer}
  onAnswerSelect={(answer) => setAnswer(answer)}
  isReview={false}
/>
```

---

### PracticeSet Component
Main component managing the entire practice session.

**Props:**
- `practiceSetId` (string) - ID of the practice set
- `onComplete` (function) - Callback with score when completed
- `onCancel` (function) - Callback when user exits

**Features:**
- Loads practice set from API
- Displays questions one at a time
- Question navigation (previous/next)
- Quick question grid for jumping to specific questions
- Progress tracking
- Auto-submit on timer expiration
- Manual submit button
- Error handling and loading states

**Usage:**
```tsx
<PracticeSet
  practiceSetId="ps_123"
  onComplete={(score) => handleComplete(score)}
  onCancel={() => navigate('/practice')}
/>
```

---

### ScoreDisplay Component
Shows practice set results with detailed breakdown.

**Props:**
- `score` (ScoreResponse) - Score data from API
- `questions` (QuestionData[]) - Array of questions
- `onRetry` (function) - Callback to start new practice set
- `onDashboard` (function) - Callback to return to dashboard

**Features:**
- Large score display with color coding
- Performance message based on score
- Statistics (correct count, percentage, time taken)
- Answer breakdown with correct/incorrect indicators
- Answer review mode with navigation
- Action buttons for retry and dashboard

**Usage:**
```tsx
<ScoreDisplay
  score={scoreData}
  questions={questionsArray}
  onRetry={() => generateNewSet()}
  onDashboard={() => navigate('/dashboard')}
/>
```

---

## Data Types

### QuestionData
```typescript
interface QuestionData {
  question_id: string
  question_text: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  order: string[] // Shuffled order of options
}
```

### ScoreResponse
```typescript
interface ScoreResponse {
  score: number
  correct_count: number
  total_questions: number
  answers: Record<string, {
    user_answer: string
    correct_answer: string
    is_correct: boolean
  }>
  time_taken: number
}
```

---

## Styling

All components use CSS modules with responsive design:

- **Timer.css** - Timer styling with animations
- **Question.css** - Question and options styling
- **PracticeSet.css** - Main practice session layout
- **ScoreDisplay.css** - Results and review styling

### Color Scheme
- Primary: #667eea (Purple)
- Secondary: #764ba2 (Dark Purple)
- Success: #28a745 (Green)
- Warning: #ffc107 (Yellow)
- Error: #dc3545 (Red)
- Background: #f5f7fa (Light Gray)

---

## Usage Flow

### 1. Paper Selection
User selects a JAIIB paper from the Practice page.

```tsx
// Practice.tsx
const handlePaperSelect = async (paperId: string) => {
  const data = await apiClient.generatePracticeSet(paperId)
  setPracticeSetId(data.practice_set_id)
  setPageState('practice')
}
```

### 2. Practice Session
PracticeSet component displays questions and manages the session.

```tsx
<PracticeSet
  practiceSetId={practiceSetId}
  onComplete={handlePracticeComplete}
  onCancel={handleCancel}
/>
```

### 3. Results Display
ScoreDisplay shows results and allows review.

```tsx
<ScoreDisplay
  score={score}
  questions={practiceSet.questions}
  onRetry={handleRetry}
  onDashboard={handleDashboard}
/>
```

---

## Features

### Timer Management
- Automatic countdown from 10 minutes
- Color warnings at 5 minutes and 1 minute
- Auto-submit when time expires
- Pause/resume capability

### Question Navigation
- Previous/Next buttons
- Quick jump via question grid
- Progress indicator
- Answered question highlighting

### Answer Review
- View all answers after submission
- See correct vs incorrect answers
- Navigate through answers
- Performance breakdown

### Responsive Design
- Mobile-friendly layouts
- Touch-friendly buttons
- Adaptive grid layouts
- Optimized for tablets and desktops

---

## Error Handling

All components include error handling:

```tsx
try {
  const data = await apiClient.getPracticeSet(practiceSetId)
  setPracticeSet(data)
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to load')
  setState('error')
}
```

---

## Accessibility

Components follow accessibility best practices:

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Focus indicators
- Screen reader friendly

---

## Performance Optimizations

- Lazy loading of questions
- Efficient state management
- Memoized callbacks
- CSS animations for smooth transitions
- Optimized re-renders

---

## Future Enhancements

- [ ] Explanation panel integration
- [ ] Bookmarking questions
- [ ] Difficulty level indicators
- [ ] Performance analytics
- [ ] Offline support
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Voice-based navigation
