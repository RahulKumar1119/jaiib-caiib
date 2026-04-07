# JAIIB-CAIIB Exam Prep Portal - Frontend

A Next.js 15 frontend application for the JAIIB-CAIIB Exam Prep Portal, built with TypeScript, Tailwind CSS, and React Context API.

## Features

- **Authentication**: Secure login, registration, and password reset
- **Practice Sets**: Generate 4-question practice sets for each JAIIB paper
- **Real-time Timer**: 10-minute countdown with visual indicators
- **Score Tracking**: Automatic scoring and performance analytics
- **Dashboard**: Comprehensive metrics and trend analysis
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Built-in dark mode support
- **Accessibility**: WCAG AA compliant with semantic HTML and ARIA labels

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context API
- **Testing**: Jest and React Testing Library

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── reset-password/
│   │   └── reset-password/[token]/
│   ├── (protected)/              # Protected routes
│   │   ├── dashboard/
│   │   ├── practice/
│   │   └── profile/
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── lib/
│   ├── api-client.ts             # Axios API client
│   ├── auth-context.tsx          # Authentication context
│   ├── notification-context.tsx  # Notification context
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Utility functions
├── styles/
│   └── globals.css               # Global styles
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `http://localhost:3001` (or configured via `NEXT_PUBLIC_API_URL`)

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

### Testing

```bash
npm test                 # Run tests once
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## API Integration

The frontend communicates with the backend API through the `apiClient` instance in `lib/api-client.ts`. The client includes:

- **Request Interceptor**: Automatically injects authentication tokens
- **Response Interceptor**: Handles errors and token refresh
- **Retry Logic**: Automatic retry on 401 with token refresh
- **Timeout**: 10-second timeout for all requests

### Authentication Flow

1. User logs in with email, password, and tenant ID
2. Backend returns session token and refresh token
3. Tokens are stored in localStorage
4. Session token is included in all subsequent requests
5. On token expiration (401), refresh token is used to get a new session token
6. If refresh fails, user is redirected to login

## Contexts and Hooks

### AuthContext

Manages user authentication state and operations.

```typescript
const { user, isAuthenticated, login, logout, error } = useAuth()
```

### NotificationContext

Manages toast notifications.

```typescript
const { addNotification, removeNotification } = useNotification()
addNotification('Success!', 'success', 5000)
```

### Custom Hooks

- `useAuth()`: Authentication operations
- `usePracticeSet()`: Practice set generation and submission
- `useDashboard()`: Dashboard metrics fetching
- `useTimer()`: Timer management for practice sessions
- `useNotification()`: Toast notifications

## Styling

The application uses Tailwind CSS with custom color schemes for JAIIB branding:

- **Primary**: Sky blue (`primary-*`)
- **Secondary**: Purple (`secondary-*`)
- **Success**: Green (`success-*`)
- **Warning**: Amber (`warning-*`)
- **Danger**: Red (`danger-*`)

### Responsive Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Accessibility

The application follows WCAG AA standards:

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Focus indicators for keyboard users
- Screen reader support

## Performance

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Built-in Next.js image optimization
- **CSS Optimization**: Tailwind CSS purging unused styles
- **API Caching**: Axios interceptor for response caching
- **Lazy Loading**: Components loaded on demand

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Docker

```bash
docker build -t jaiib-frontend .
docker run -p 3000:3000 jaiib-frontend
```

### Environment Variables for Production

Set these in your deployment platform:

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_APP_NAME`: Application name
- `NEXT_PUBLIC_APP_VERSION`: Version number
- `NEXT_PUBLIC_LOG_LEVEL`: Logging level (warn for production)

## Troubleshooting

### API Connection Issues

1. Verify backend is running on the configured URL
2. Check `NEXT_PUBLIC_API_URL` environment variable
3. Ensure CORS is properly configured on backend

### Authentication Issues

1. Clear browser localStorage and cookies
2. Check token expiration in browser DevTools
3. Verify tenant ID is correct

### Build Issues

1. Clear `.next` directory: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (should be 18+)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -am 'Add feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

Proprietary - JAIIB-CAIIB Exam Prep Portal

## Support

For issues and questions, contact the development team.
