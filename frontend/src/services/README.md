# API Client Service

Centralized HTTP client for all backend API communication with built-in authentication, error handling, and request/response interceptors.

## Overview

The API client service provides:
- Singleton instance for consistent API communication
- Automatic token injection in request headers
- Token refresh on 401 responses
- Centralized error handling
- Type-safe API responses
- Environment-based configuration

## Usage

### Basic API Calls

```typescript
import { apiClient } from '@/services/api'

// Login
const response = await apiClient.login('user@example.com', 'password')

// Generate practice set
const practiceSet = await apiClient.generatePracticeSet('JAIIB_IE_IFS')

// Submit answers
const score = await apiClient.submitPracticeSet(practiceSetId, answers)

// Get dashboard metrics
const metrics = await apiClient.getDashboardMetrics()
```

### With useApi Hook

```typescript
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'

function MyComponent() {
  const { data, loading, error, execute } = useApi(
    () => apiClient.getDashboardMetrics()
  )

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <p>Score: {data.average_score}</p>}
    </div>
  )
}
```

### With useAuth Hook

```typescript
import { useAuth } from '@/context/AuthContext'

function LoginForm() {
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password)
      // User is now authenticated
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    // Form JSX
  )
}
```

## API Endpoints

### Authentication

- `login(email, password)` - POST /auth/login
- `register(fullName, email, password, confirmPassword)` - POST /auth/register
- `logout()` - POST /auth/logout
- `resetPassword(email)` - POST /auth/reset-password
- `verifyResetToken(resetToken, newPassword)` - POST /auth/verify-reset-token

### Practice Sets

- `generatePracticeSet(paper)` - POST /practice-sets
- `getPracticeSet(practiceSetId)` - GET /practice-sets/{id}
- `submitPracticeSet(practiceSetId, answers)` - POST /practice-sets/{id}/submit
- `resumePracticeSet(practiceSetId)` - GET /practice-sets/{id}/resume

### Explanations

- `getExplanation(questionId)` - POST /explanations
- `getCachedExplanation(explanationId)` - GET /explanations/{id}

### Dashboard

- `getDashboardMetrics()` - GET /dashboard/metrics
- `getUserScores(paper?, limit?)` - GET /dashboard/scores

### User Profile

- `getUserProfile()` - GET /user/profile
- `updateUserProfile(data)` - PUT /user/profile

### Admin

- `createQuestion(questionData)` - POST /admin/questions
- `updateQuestion(questionId, questionData)` - PUT /admin/questions/{id}
- `deleteQuestion(questionId)` - DELETE /admin/questions/{id}
- `getQuestions(paper?, status?)` - GET /admin/questions

## Error Handling

The API client throws `ApiError` exceptions with status code and error code:

```typescript
import { ApiError } from '@/services/api'

try {
  await apiClient.login(email, password)
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error ${error.statusCode}: ${error.errorCode}`)
    console.error(error.message)
  }
}
```

## Token Management

Tokens are automatically managed:
- Stored in localStorage after login
- Injected in Authorization header for all requests
- Automatically refreshed on 401 responses
- Cleared on logout

### Manual Token Operations

```typescript
// Check if authenticated
if (apiClient.isAuthenticated()) {
  // User has valid token
}

// Check if token is expiring soon (within 5 minutes)
if (apiClient.isTokenExpiring()) {
  // Token will expire soon
}

// Get time until expiry in milliseconds
const timeRemaining = apiClient.getTimeUntilExpiry()
```

## Configuration

Set the API base URL via environment variable:

```env
VITE_API_BASE_URL=https://api.example.com
```

If not set, defaults to:
- Development: `http://localhost:3000/api`
- Production: `/api` (relative path)

## Response Types

All API methods return typed responses:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface AuthResponse {
  success: boolean
  user?: User
  session_token?: string
  expires_in?: number
  refresh_token?: string
}

interface PracticeSetResponse {
  practice_set_id: string
  paper: string
  questions: Question[]
  session_token: string
  session_expires_at: number
  time_limit_seconds: number
}

interface ScoreResponse {
  score: number
  correct_count: number
  total_questions: number
  answers: Record<string, AnswerDetail>
  time_taken: number
}
```

## Best Practices

1. **Always use useAuth for authentication** - Provides global state management
2. **Use useApi hook for data fetching** - Handles loading and error states
3. **Handle ApiError exceptions** - Check error.statusCode and error.errorCode
4. **Don't store sensitive data in localStorage** - Only tokens are stored
5. **Use protected routes** - Wrap routes that require authentication
6. **Clear errors after displaying** - Call clearError() in auth context

## Interceptors

### Request Interceptor
- Automatically adds Authorization header with Bearer token
- Validates token before each request

### Response Interceptor
- Handles 401 Unauthorized responses
- Attempts token refresh
- Redirects to login on refresh failure
- Retries original request with new token

## Troubleshooting

### Token not being sent
- Check if `apiClient.isAuthenticated()` returns true
- Verify token is stored in localStorage
- Check Authorization header in network tab

### 401 Unauthorized errors
- Token may have expired
- Refresh token may be invalid
- User may have been logged out from another session

### CORS errors
- Verify API base URL is correct
- Check API Gateway CORS configuration
- Ensure credentials are included in requests

## Future Enhancements

- [ ] Request caching
- [ ] Offline support with service workers
- [ ] Request queuing during network outages
- [ ] Automatic retry with exponential backoff
- [ ] Request/response logging
- [ ] Performance monitoring
