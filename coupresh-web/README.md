# CouPreshFund Web

Mobile-first React frontend for the CouPreshFund student financial empowerment platform. Student registration and login are connected to the Express backend. The onboarding profile, dashboard, learning, savings, goals, and guardian features are still prototype experiences unless noted below.

## Requirements and setup

Requirements: Node.js, npm, and a running PostgreSQL database configured for the backend.

Install dependencies once in each project:

```sh
cd coupresh-backend
npm install

cd ../coupresh-web
npm install
```

Configure the backend's private `coupresh-backend/.env` with PostgreSQL settings (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT`) and a `JWT_SECRET`. Do not put database credentials or the JWT secret in the web project's environment file or commit them.

Start the backend in one terminal:

```sh
cd coupresh-backend
npm start
```

Start the frontend in another terminal:

```sh
cd coupresh-web
npm run dev
```

Open the local URL printed by Vite. The backend defaults to `http://localhost:5000`. Its health endpoint is `GET http://localhost:5000/api/v1/health`.

## Backend features integrated

The backend mounts student authentication at `/api/v1/auth`. The frontend calls these endpoints through the shared helper in `src/utils/authApi.js`.

| Backend endpoint | Frontend behavior |
| --- | --- |
| `POST /api/v1/auth/register` | The student details screen sends `fullName`, `email`, and `password`. On success, the frontend automatically calls login because registration does not return a token. The backend also accepts phone registration, but the current signup screen only collects email. |
| `POST /api/v1/auth/login` | The sign-in screen submits an email or phone number and password. The backend checks those credentials against a registered student; invalid credentials are rejected. |
| `GET /api/v1/auth/me` | `getCurrentStudent()` calls this authenticated endpoint. The request helper adds `Authorization: Bearer <token>` when a token is present. |
| `GET /api/v1/health` | Available from the backend for checking whether the API is running; the frontend does not currently call it automatically. |

The login token is stored in browser local storage under `coupreshfund.authToken`. The backend issues a JWT that expires after one day. Login and registration errors are shown in the UI; login errors appear in a prominent, dismissible alert at the top of the screen. Duplicate email or phone registrations are rejected by the backend.

## API configuration for the frontend

For local development, Vite proxies requests beginning with `/api` to `http://localhost:5000`. To use a different backend origin with the proxy, set `VITE_BACKEND_ORIGIN` in a local `coupresh-web/.env` file, for example:

```env
VITE_BACKEND_ORIGIN=http://localhost:5000
```

Alternatively, set `VITE_API_BASE_URL` to a full API base URL when the browser should call the API directly, for example `https://api.example.com/api/v1`. In that setup the backend must allow the frontend's origin through CORS. Restart Vite after changing environment variables. Vite variables are included in client-side code: only use them for public URLs, never secrets.

## What remains to be connected

The backend currently provides student authentication only. These frontend features do not yet have backend persistence or data endpoints:

- Campus, course, level, and graduation-year details.
- Student goals, purpose, contribution amount, and savings cadence.
- Dashboard and profile data beyond the account's name and email/phone.
- Savings activity, roadmap progress, and Growth Unlock data.
- Learning content/progress and guardian invitations.

Those features need corresponding backend models and API routes, then frontend requests to those routes. The current frontend keeps onboarding/profile state in memory, so that data is lost on refresh. Login currently starts the frontend's local home experience; the app does not yet restore a session by calling `/me` after a page reload or use it to protect routes. The sign-out UI clears the stored token.

## Checks

```sh
npm run lint
npm run build
```

## Main routes

| Route | Page |
| --- | --- |
| `/` | Welcome |
| `/login` | Sign in |
| `/signup/details` | Student account registration |
| `/signup/campus` | Institution and graduation details (frontend-only) |
| `/signup/goal` | Graduation goal and purpose (frontend-only) |
| `/signup/savings-plan` | Contribution amount and cadence (frontend-only) |
| `/signup/complete` | Profile summary |
| `/home` | Student dashboard prototype |
| `/roadmap` | Savings milestones prototype |
| `/goals` | Growth Unlock simulation |
| `/goals/invite` | Parent or guardian invite preview |
| `/learn` | Financial learning lessons prototype |
| `/profile` | Student profile and sign out |

## Project structure

- `src/pages/` contains route-level screens.
- `src/components/` contains shared navigation, branding, and layout.
- `src/utils/authApi.js` contains the authentication API helper.
- `src/App.jsx` defines routes and holds the in-memory student profile state.

## Prototype and data notice

Authentication uses the backend, but most other product screens still use local or mock data and are not persisted. No money is moved or invested; Growth Unlock is an illustration, not financial advice. Do not use real personal or financial information until the application has appropriate production security, privacy, and data-handling measures.