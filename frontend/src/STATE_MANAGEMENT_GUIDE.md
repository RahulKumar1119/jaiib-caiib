# State Management & Error Handling Guide

Complete documentation for state management, error handling, and loading states in the JAIIB-CAIIB frontend.

## Overview

The frontend uses a combination of:
- **React Context API** for global state management
- **Error Boundaries** for error handling
- **Loading Skeletons** for loading states
- **Custom Hooks** for API integration

## State Management

### 1. AuthContext

Manages global authentication state.

**Location:** `src/context/AuthContext.tsx`

**State:**
```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
}
```

**Usage:**
```tsx
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  return (
    <div>
      {isAuthenticated && <p>Welcome, {user?.full_name}</p>}
    </div>
  )
}
```

**Features:**
- Automatic auth check on app load
- Token management
- Error handling
- Loading states

---

### 2. PracticeContext

Manages practice session state.

**Location:** `src/context/PracticeContext.tsx`

**State:**
```typescript
interface PracticeSession {
  practiceSetId: string | null
  paper: string | null
  currentQuestionIndex: number
  answers: Record<string, string>
  startTime: number | null
  score: ScoreResponse | null
}

interface PracticeContextType {
  session: PracticeSession
  startSession: (practiceSetId: string, paper: string) => void
  updateAnswer: (questionId: string, answer: string) => void
  completeSession: (score: ScoreResponse) => void
  resetSession: () => void
  setCurrentQuestion: (index: number) => void
}
```

**Usage:**
```tsx
import { usePractice } from '@/context/PracticeContext'

function PracticeComponent() {
  const { session, updateAnswer, completeSession } = usePractice()

  const handleAnswerSelect = (answer: string) => {
    updateAnswer(currentQuestion.question_id, answer)
  }

  return (
    // Component JSX
  )
}
```

**Features:**
- Session tracking
- Answer management
- Score tracking
- Session reset

---

## Error Handling

### 1. Error Boundary

Catches React errors and displays fallback UI.

**Location:** `src/components/ErrorBoundary.tsx`

**Usage:**
```tsx
import ErrorBoundary from '@/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  )
}
```

**Features:**
- Catches React errors
- Displays error UI
- Shows error details in development
- Retry functionality
- Graceful fallback

**Error Details (Development Only):**
- Error message
- Component stack trace
- Helpful debugging information

---

### 2. API Error Handling

Custom error class for API errors.

**Location:** `src/services/api.ts`

**Error Class:**
```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode?: string,
    message?: string
  ) {
    super(message || 'API Error')
    this.name = 'ApiError'
  }
}
```

**Usage:**
```tsx
try {
  await apiClient.login(email, password)
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error ${error.statusCode}: ${error.errorCode}`)
    console.error(error.message)
  }
}
```

**Error Codes:**
- `INVALID_CREDENTIALS` - Login failed
- `NETWORK_ERROR` - Network request failed
- `UNKNOWN_ERROR` - Unknown error occurred

---

### 3. Component-level Error Handling

Handle errors in components with try-catch.

**Pattern:**
```tsx
const [error, setError] = useState<string | null>(null)
const [isLoading, setIsLoading] = useState(false)

const handleAction = async () => {
  try {
    setIsLoading(true)
    setError(null)
    await apiClient.someAction()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    setError(message)
  } finally {
    setIsLoading(false)
  }
}
```

---

## Loading States

### 1. Loading Skeleton

Displays placeholder content while loading.

**Location:** `src/components/LoadingSkeleton.tsx`

**Types:**
- `card` - Card skeleton
- `text` - Text skeleton
- `chart` - Chart skeleton
- `dashboard` - Dashboard skeleton

**Usage:**
```tsx
import LoadingSkeleton from '@/components/LoadingSkeleton'

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)

  if (isLoading) {
    return <LoadingSkeleton type="dashboard" />
  }

  return <div>Dashboard Content</div>
}
```

**Features:**
- Shimmer animation
- Multiple skeleton types
- Responsive design
- Smooth transitions

---

### 2. Loading States in Components

**Pattern:**
```tsx
if (isLoading) {
  return <LoadingSkeleton type="card" count={3} />
}

if (error) {
  return <ErrorMessage error={error} onRetry={handleRetry} />
}

return <Content data={data} />
```

---

## Retry Mechanisms

### 1. Automatic Retry

Implemented in API client interceptors.

**Features:**
- Automatic token refresh on 401
- Retry original request with new token
- Exponential backoff for failed requests

---

### 2. Manual Retry

Provide retry button in error states.

**Pattern:**
```tsx
const [retryCount, setRetryCount] = useState(0)

useEffect(() => {
  fetchData()
}, [retryCount])

const handleRetry = () => {
  setRetryCount((prev) => prev + 1)
}

return (
  <div>
    {error && <button onClick={handleRetry}>Try Again</button>}
  </div>
)
```

---

## Dashboard State Management

### Metrics Fetching

```tsx
const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getDashboardMetrics()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  fetchMetrics()
}, [])
```

### Paper-wise Stats

```tsx
const getPaperStats = (paperId: string) => {
  return metrics?.paper_stats[paperId] || null
}

const stats = getPaperStats('JAIIB_IE_IFS')
if (stats) {
  console.log(`Average: ${stats.average_score}`)
  console.log(`Highest: ${stats.highest_score}`)
  console.log(`Count: ${stats.practice_count}`)
}
```

### Recent Results

```tsx
metrics.recent_scores.map((score) => (
  <div key={score.score_id}>
    <span>{score.paper}</span>
    <span>{score.score}%</span>
    <span>{new Date(score.created_at * 1000).toLocaleDateString()}</span>
  </div>
))
```

---

## Best Practices

### 1. Error Handling

✅ **DO:**
- Catch errors at component level
- Show user-friendly error messages
- Provide retry options
- Log errors for debugging

❌ **DON'T:**
- Ignore errors silently
- Show technical error messages to users
- Retry indefinitely
- Log sensitive information

### 2. Loading States

✅ **DO:**
- Show loading skeleton while fetching
- Disable buttons during loading
- Show loading message
- Provide cancel option

❌ **DON'T:**
- Show blank screen while loading
- Allow multiple simultaneous requests
- Hide loading state too quickly
- Show loading forever

### 3. State Management

✅ **DO:**
- Use Context for global state
- Keep state minimal
- Update state immutably
- Use callbacks for state updates

❌ **DON'T:**
- Prop drill deeply
- Mutate state directly
- Store derived data
- Update state in render

---

## Error Scenarios

### Network Error

```
User Action
  ↓
API Request
  ↓
Network Fails
  ↓
ApiError (NETWORK_ERROR)
  ↓
Component catches error
  ↓
Show error message + retry button
```

### Authentication Error

```
API Request
  ↓
401 Unauthorized
  ↓
Interceptor attempts token refresh
  ↓
Refresh succeeds → Retry request
Refresh fails → Redirect to login
```

### Validation Error

```
User submits form
  ↓
Validation fails
  ↓
Show validation errors
  ↓
User corrects and resubmits
```

---

## Loading State Transitions

```
Initial
  ↓
Loading (show skeleton)
  ↓
Success (show content) OR Error (show error message)
  ↓
User can retry or navigate away
```

---

## Context Provider Setup

```tsx
// App.tsx
import { AuthProvider } from '@/context/AuthContext'
import { PracticeProvider } from '@/context/PracticeContext'
import ErrorBoundary from '@/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PracticeProvider>
          <Routes>
            {/* Routes */}
          </Routes>
        </PracticeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
```

---

## Debugging

### Enable Debug Mode

```env
VITE_ENABLE_DEBUG_MODE=true
```

### Check State

```tsx
// In component
const { user, isAuthenticated } = useAuth()
console.log('Auth State:', { user, isAuthenticated })

const { session } = usePractice()
console.log('Practice Session:', session)
```

### Monitor API Calls

```tsx
// In browser DevTools
// Network tab shows all API requests
// Check request/response headers and body
```

---

## Performance Optimization

### Memoization

```tsx
import { useMemo, useCallback } from 'react'

const memoizedValue = useMemo(() => {
  return expensiveCalculation(data)
}, [data])

const memoizedCallback = useCallback(() => {
  handleAction()
}, [])
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('@/pages/Dashboard'))

function App() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Dashboard />
    </Suspense>
  )
}
```

---

## Testing

### Test Error Boundary

```tsx
it('catches errors and displays fallback', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
})
```

### Test Context

```tsx
it('provides auth state', () => {
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })

  expect(result.current.isAuthenticated).toBe(false)
})
```

---

## Troubleshooting

### State Not Updating

**Issue:** State changes don't reflect in UI

**Solutions:**
1. Check if state is being updated immutably
2. Verify component is re-rendering
3. Check React DevTools for state changes

### Error Boundary Not Catching

**Issue:** Error Boundary doesn't catch error

**Solutions:**
1. Error Boundary only catches render errors
2. Use try-catch for async errors
3. Check console for error details

### Loading State Stuck

**Issue:** Loading state never completes

**Solutions:**
1. Check if API request is hanging
2. Verify finally block is executing
3. Check network tab for request status

---

## Support

For issues or questions:
1. Check this guide
2. Review component code
3. Check browser console
4. Contact support team
