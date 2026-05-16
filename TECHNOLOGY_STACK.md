# Technology Stack

This document summarizes the technologies used in the Lufthansa POC project.

## Backend

### Python API Backend

- **Python**: Used for the standalone backend service.
- **FastAPI**: Used to create the mock authentication API.
- **Pydantic**: Used for request body validation.
- **CORS Middleware**: Enabled through FastAPI to allow the frontend to call the backend.
- **Uvicorn**: Used to run the FastAPI backend locally.

Current backend endpoint:

- `POST /auth/login` returns a mock authentication token for the submitted email.

### Next.js Server API Routes

The project also uses Next.js API routes as a server-side backend layer for AI features.

- **Next.js Route Handlers**: Used under `app/api/*` for server-side API endpoints.
- **Google Gemini API**: Used for generating marketing copy, social media posts, and image prompts or images.
- **OpenAI Images API**: Used as one image-generation provider for marketing banners.
- **Stability AI API**: Used as another image-generation provider for marketing banners.
- **Environment Variables**: Used to configure API keys and model names.

Current server API routes:

- `POST /api/generate-copy`
- `POST /api/generate-banner`
- `POST /api/generate-social`

## Frontend

- **Next.js 16.2.6**: Main frontend framework.
- **React 19.2.4**: Used to build the UI components and pages.
- **TypeScript 5**: Used for typed frontend and API route code.
- **App Router**: The project uses the Next.js `app` directory structure.
- **Tailwind CSS 4**: Used for styling the UI.
- **PostCSS**: Used with Tailwind CSS through `@tailwindcss/postcss`.
- **ESLint 9**: Used for linting.
- **eslint-config-next**: Used for Next.js and TypeScript linting rules.

Main frontend areas:

- Login page with mock authentication.
- Dashboard pages for copy, banner, and social campaign generation.
- Shared React components such as navigation, loading spinner, feature tabs, and copy button.

## Local Development

Frontend development server:

```bash
npm run dev
```

Backend development server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Package Management

- **npm**: Used for frontend dependencies and scripts.
- **Python virtual environment**: Used for backend Python dependencies.

## Configuration

The project uses environment variables for runtime configuration, including:

- `NEXT_PUBLIC_API_URL`
- `GEMINI_API_KEY_1` through `GEMINI_API_KEY_5`
- `GEMINI_MODEL`
- `GEMINI_IMAGE_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`
- `STABILITY_API_KEY`
- `STABILITY_IMAGE_MODEL`
