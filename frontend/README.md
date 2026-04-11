# JAIIB-CAIIB Exam Prep Portal - Frontend

React + Vite frontend for the JAIIB-CAIIB exam preparation platform.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TypeScript** - Type safety
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/          # Page components
│   ├── styles/         # CSS files
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## Pages

- **Login** (`/login`) - User authentication
- **Dashboard** (`/dashboard`) - Main dashboard
- **Root** (`/`) - Redirects to login

## API Integration

The app communicates with the backend API at `/api`. In development, requests are proxied to `http://localhost:3001`.

### Authentication

- Login endpoint: `POST /api/auth/login`
- Token stored in localStorage
- Passed in Authorization header: `Bearer {token}`

## Deployment

The app is deployed on AWS Amplify. Push to the `main` branch to trigger automatic deployment.

### Build Output

- Output directory: `dist/`
- Served as static files via CloudFront CDN
- URL: `https://main.d38n04eo91rm1n.amplifyapp.com`

## Environment Variables

Create a `.env` file in the frontend directory:

```
VITE_API_URL=http://localhost:3001
```

## Linting

```bash
npm run lint
```

## License

MIT
