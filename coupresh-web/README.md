# CouPreshFund Web

Responsive React frontend for the CouPreshFund student financial empowerment platform. It provides the welcome and account flows, student dashboard, savings and budgeting views, financial learning, growth activities, future planning, and profile screens.

## Requirements

- Node.js and npm
- The CouPreshFund backend and PostgreSQL database for account registration and sign-in

## Local setup

Install dependencies in each project:

```sh
cd coupresh-backend
npm install

cd ../coupresh-web
npm install
```

Configure `coupresh-backend/.env` with the backend's PostgreSQL settings (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT`) and `JWT_SECRET`. Keep credentials and secrets out of the web project and source control.

Run the backend in one terminal:

```sh
cd coupresh-backend
npm start
```

Run the frontend in another terminal:

```sh
cd coupresh-web
npm run dev
```

Open the local URL printed by Vite. By default, Vite forwards `/api` requests to `http://localhost:5000`. The backend health endpoint is `GET http://localhost:5000/api/v1/health`.

## Frontend API configuration

For local development, set `VITE_BACKEND_ORIGIN` in a local `coupresh-web/.env` file to change the Vite proxy target:

```env
VITE_BACKEND_ORIGIN=http://localhost:5000
```

Alternatively, set `VITE_API_BASE_URL` to a complete API base URL, such as `https://api.example.com/api/v1`, for direct browser requests. The backend must allow the frontend's origin through CORS. Restart Vite after changing environment variables. Vite variables are included in client-side code; only use them for public configuration, never secrets.

## Account features connected to the backend

The shared request helper is `src/utils/authApi.js`. It uses `/api/v1` by default.

| Endpoint | Frontend behavior |
| --- | --- |
| `POST /api/v1/auth/register` | Sends the student's name, password, and supplied email and/or phone number. After registration, the frontend signs in automatically. |
| `POST /api/v1/auth/login` | Signs in with an email address or phone number and password. |
| `GET /api/v1/auth/me` | Available through `getCurrentStudent()` for retrieving the authenticated student. |
| `GET /api/v1/health` | Backend health endpoint; the frontend does not call it automatically. |

The authentication token is stored in browser local storage under `coupreshfund.authToken` and is included in authenticated requests. The backend issues a token that expires after one day. Registration and sign-in errors are displayed in the interface.

## Product screens and data status

The UI includes the complete student journey and dashboard navigation. Account registration and sign-in use the backend. The backend currently exposes authentication only; campus and graduation details, goals, savings plans, dashboard figures, learning progress, opportunities, and guardian invitations are not yet loaded from or saved to backend product APIs. These screens currently use frontend state and predefined interface content. Signup details beyond the identity fields are held in memory and are lost on refresh.

No savings or investment transaction is initiated by the frontend. The growth projection is a client-side calculation. Connect the relevant screens to backend models and API routes before relying on displayed product data as account-backed or live information. The app does not currently restore an authenticated session from `/me` after reload or protect dashboard routes.

## Main routes

| Route | Screen |
| --- | --- |
| `/` | Welcome and onboarding |
| `/login` | Sign in |
| `/signup/details` | Student account creation |
| `/signup/campus` | Institution and graduation details |
| `/signup/goal` | Graduation goal and purpose |
| `/signup/savings-plan` | Contribution amount and cadence |
| `/signup/complete` | Account setup summary |
| `/home` | Student home dashboard |
| `/money` | My Money and graduation fund |
| `/money/budget` | Budget Planner |
| `/learn` | Learning Hub |
| `/growth` | Skills & Entrepreneurship |
| `/growth/challenge` | Challenge Details |
| `/growth/progress` | My Growth Progress |
| `/future` | My Future |
| `/future/opportunities` | Opportunities |
| `/future/points` | Points & Tiers |
| `/profile` | Profile & Settings |
| `/goals` | Growth Unlock |
| `/goals/invite` | Parent or guardian invitation |
| `/roadmap` | Redirects to My Future |

## Responsive design and branding

The interface adapts to viewport size: dashboard screens use available laptop width with multi-column layouts on desktop and a single-column layout on mobile. The onboarding and account creation screens follow the updated product direction. The supplied CoupreshFund logo is served from `public/coupreshfund-logo.png`.

The dashboard route views are consolidated in `src/pages/DashboardExperience.jsx` with their styles in `src/pages/DashboardExperience.css`. Other route-level screens are in `src/pages/`.

## Checks

Run these commands from `coupresh-web`:

```sh
npm run lint
npm run build
```
