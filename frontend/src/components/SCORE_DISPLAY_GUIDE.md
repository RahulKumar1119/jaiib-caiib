# Score & Results Display Guide

Complete documentation for the enhanced Score Display and Explanation Panel components.

## Overview

The Score & Results Display system provides:
- Real-time score calculation and display
- Detailed performance breakdown
- Answer review with correct/incorrect indicators
- AI-powered explanations with RBI/IIBF citations
- Performance insights and recommendations

## Components

### ScoreDisplay Component

Main component for displaying practice set results.

**Props:**
```typescript
interface ScoreDisplayProps {
  score: ScoreResponse           // Score data from API
  questions: QuestionData[]      // Array of questions
  onRetry: () => void           // Callback to start new set
  onDashboard: () => void       // Callback to return to dashboard
}
```

**Features:**
- Large score display with color coding
- Performance statistics (correct count, percentage, time)
- Answer breakdown with clickable items
- Performance insights based on score
- Answer review mode
- Explanation panel integration

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

### ExplanationPanel Component

Modal panel displaying AI-generated explanations.

**Props:**
```typescript
interface ExplanationPanelProps {
  questionId: string           // Question ID
  questionText: string         // Question text
  correctAnswer: string        // Correct answer (A/B/C/D)
  userAnswer: string          // User's answer (A/B/C/D)
  isCorrect: boolean          // Whether answer was correct
  onClose: () => void         // Callback to close panel
}
```

**Features:**
- Question display
- Answer status (correct/incorrect)
- AI-generated explanation
- RBI norms and guidelines
- IIBF guidelines
- Key takeaway section
- Loading and error states

**Usage:**
```tsx
<ExplanationPanel
  questionId="q_123"
  questionText="What is..."
  correctAnswer="A"
  userAnswer="B"
  isCorrect={false}
  onClose={() => setShowExplanation(false)}
/>
```

---

## Score Calculation

### Scoring Formula

```
Score = (Correct Answers / Total Questions) × 100
```

**Example:**
- 4 questions total
- 3 correct answers
- Score = (3/4) × 100 = 75%

### Score Color Coding

| Score Range | Color | Category |
|-------------|-------|----------|
| 75-100% | Green | Excellent |
| 50-74% | Purple | Good |
| 25-49% | Yellow | Fair |
| 0-24% | Red | Poor |

### Performance Messages

| Score Range | Message |
|-------------|---------|
| ≥75% | 🎉 Excellent performance! |
| 50-74% | 👍 Good effort! Keep practicing. |
| 25-49% | 💪 Keep working on these topics. |
| <25% | 📚 Review the concepts and try again. |

---

## Answer Review Mode

### Features

1. **Question Navigation**
   - Previous/Next buttons
   - Question counter (e.g., "Question 1 of 4")
   - Disabled buttons at boundaries

2. **Answer Display**
   - User's selected answer highlighted
   - Correct answer shown
   - Visual indicators (✓ for correct, ✗ for incorrect)

3. **Explanation Access**
   - "Get Explanation" button on each question
   - Opens explanation panel
   - Loads AI-generated content

### Usage Flow

```
1. User clicks "Review Answers"
2. First question displayed in review mode
3. User can navigate between questions
4. Click "Get Explanation" to view details
5. Click "Back to Results" to return
```

---

## Explanation Panel Details

### Content Sections

#### 1. Question Section
- Displays the question text
- Highlighted with blue left border
- Clear, readable formatting

#### 2. Answer Status
- Shows if answer was correct or incorrect
- Color-coded background (green/red)
- Helpful message explaining the result

#### 3. Explanation Text
- AI-generated explanation from Claude 4.5 Haiku
- Explains why the correct answer is right
- Discusses why other options are wrong
- Clear, educational language

#### 4. RBI Norms & Guidelines
- References to Reserve Bank of India regulations
- Relevant banking guidelines
- Regulatory context for the question

#### 5. IIBF Guidelines
- References to Indian Institute of Banking and Finance standards
- Exam-relevant guidelines
- Syllabus alignment

#### 6. Key Takeaway
- Summary of the concept
- Memorable point for exam preparation
- Reinforces correct answer

### Loading States

```
Loading → Loaded → Display Content
         ↓
        Error → Show Error Message
```

### Error Handling

If explanation fails to load:
- Shows user-friendly error message
- Provides close button
- Allows user to continue

---

## Performance Insights

### Insight Messages

**Excellent (≥75%)**
```
🌟 Outstanding! You're well-prepared for the exam. 
Focus on the questions you missed to achieve perfection.
```

**Good (50-74%)**
```
📈 Good progress! Review the incorrect answers and 
strengthen your weak areas before the exam.
```

**Fair (25-49%)**
```
🎯 Keep practicing! Focus on understanding the concepts 
behind each question. Review the explanations carefully.
```

**Poor (<25%)**
```
💪 Don't give up! Start with the basics and gradually 
increase difficulty. Review all explanations thoroughly.
```

---

## Data Types

### ScoreResponse
```typescript
interface ScoreResponse {
  score: number                    // Score 0-100
  correct_count: number            // Number of correct answers
  total_questions: number          // Total questions (4)
  answers: Record<string, {
    user_answer: string           // User's answer (A/B/C/D)
    correct_answer: string        // Correct answer (A/B/C/D)
    is_correct: boolean           // Whether correct
  }>
  time_taken: number              // Time in seconds
}
```

### ExplanationResponse
```typescript
interface ExplanationResponse {
  explanation_id: string
  question_id: string
  correct_answer: string
  explanation_text: string        // Main explanation
  rbi_norms?: string[]           // RBI guidelines
  iibf_norms?: string[]          // IIBF guidelines
  generated_at: number
  model: string                   // "claude-3-5-sonnet"
}
```

---

## Styling

### Color Scheme

```css
Primary: #667eea (Purple)
Secondary: #764ba2 (Dark Purple)
Success: #28a745 (Green)
Warning: #ffc107 (Yellow)
Error: #dc3545 (Red)
Background: #f5f7fa (Light Gray)
```

### CSS Files

- `ScoreDisplay.css` - Results and review styling
- `ExplanationPanel.css` - Explanation modal styling

### Responsive Design

- Mobile: Single column, full-width buttons
- Tablet: Optimized spacing and layout
- Desktop: Multi-column with sidebar

---

## API Integration

### Score Calculation

Scores are calculated by the backend Lambda function:

```
POST /practice-sets/{id}/submit
Body: { answers: Record<string, string> }
Response: ScoreResponse
```

### Explanation Generation

Explanations are generated on-demand:

```
POST /explanations
Body: { question_id: string }
Response: ExplanationResponse
```

Explanations are cached for 30 days to improve performance.

---

## User Interactions

### Results Page

1. **View Score**
   - Large score circle with color coding
   - Performance message
   - Statistics (correct count, percentage, time)

2. **See Breakdown**
   - Clickable question items
   - Visual indicators (✓/✗)
   - Click to view explanation

3. **Review Answers**
   - Navigate through all questions
   - See correct vs incorrect answers
   - Get explanations for each

4. **Take Action**
   - Try Another Set (retry)
   - Back to Dashboard (exit)

### Review Mode

1. **Navigate Questions**
   - Previous/Next buttons
   - Question counter
   - Current question highlighted

2. **View Details**
   - Question text
   - User's answer
   - Correct answer
   - Visual indicators

3. **Get Explanation**
   - Click "Get Explanation" button
   - Modal opens with full details
   - Read RBI/IIBF norms
   - Close and continue

---

## Accessibility

- Semantic HTML elements
- ARIA labels on buttons
- Keyboard navigation support
- Color contrast compliance
- Focus indicators
- Screen reader friendly

---

## Performance Optimizations

- Lazy loading of explanations
- Cached explanation responses
- Efficient state management
- Memoized callbacks
- Smooth CSS animations
- Optimized re-renders

---

## Future Enhancements

- [ ] Explanation caching on client
- [ ] Offline explanation access
- [ ] Difficulty level indicators
- [ ] Topic-based performance analytics
- [ ] Comparison with other users
- [ ] Performance trends over time
- [ ] Personalized recommendations
- [ ] Export results as PDF
- [ ] Share results with instructors
- [ ] Dark mode support

---

## Troubleshooting

### Explanation Not Loading

**Issue:** Explanation panel shows loading indefinitely

**Solutions:**
1. Check network connection
2. Verify API endpoint is accessible
3. Check browser console for errors
4. Try closing and reopening explanation

### Score Not Displaying

**Issue:** Score circle shows but no value

**Solutions:**
1. Verify score data is passed correctly
2. Check ScoreResponse format
3. Ensure score is a number 0-100

### Buttons Not Responding

**Issue:** Buttons don't respond to clicks

**Solutions:**
1. Check if component is in loading state
2. Verify callback functions are passed
3. Check browser console for errors

---

## Best Practices

1. **Always show explanations** - Help users learn from mistakes
2. **Provide context** - Show RBI/IIBF norms for regulatory understanding
3. **Encourage review** - Make answer review easily accessible
4. **Offer next steps** - Provide clear actions (retry, dashboard)
5. **Celebrate success** - Show positive messages for good performance
6. **Support learning** - Provide insights and recommendations

---

## Example Usage

```tsx
import ScoreDisplay from '@/components/ScoreDisplay'
import { ScoreResponse } from '@/services/api'

function ResultsPage() {
  const [score, setScore] = useState<ScoreResponse | null>(null)
  const [questions, setQuestions] = useState<QuestionData[]>([])

  const handleRetry = () => {
    // Generate new practice set
  }

  const handleDashboard = () => {
    // Navigate to dashboard
  }

  return (
    <ScoreDisplay
      score={score}
      questions={questions}
      onRetry={handleRetry}
      onDashboard={handleDashboard}
    />
  )
}
```

---

## Support

For issues or questions:
1. Check this guide
2. Review component code
3. Check browser console
4. Contact support team
