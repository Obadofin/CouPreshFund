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
| `GET /api/v1/auth/me` | Restores the signed-in student and saved onboarding data after a page reload. |
| `PUT /api/v1/students/me/onboarding` | Saves school, graduation goal, purpose, and savings plan when onboarding is completed. |
| `PUT /api/v1/students/me/goal` | Saves the graduation goal and the complete onboarding profile from the editable Goals form. |
| `GET /api/v1/students/me/dashboard` | Loads saved goal, contribution total, progress, and recent activity for the dashboard. |
| `POST /api/v1/students/me/contributions` | Records a self-reported savings contribution from My Money. |
| `GET /api/v1/students/me/contributions` | Lists the student's saved contributions; available for history views. |
| `GET /api/v1/students/me/budgets` | Loads the signed-in student's saved budget periods. |
| `PUT /api/v1/students/me/budgets/:period` | Saves a weekly, monthly, or yearly budget amount. |
| `GET /api/v1/students/me/expenses?period=monthly` | Loads current-period expenses and their category totals. |
| `POST /api/v1/students/me/expenses` | Records a dated expense in Essentials, Learning, Transport, or Other. |
| `GET /api/v1/learning/lessons` | Loads lesson summaries for the Learning Hub. |
| `GET /api/v1/learning/lessons/:lessonId` | Loads the lesson content shown when a student opens a lesson. |
| `GET /api/v1/students/me/learning/progress` | Restores lesson progress and completed lessons. |
| `PUT /api/v1/students/me/learning/progress/:lessonId` | Saves lesson progress or marks a lesson complete. |
| `GET /api/v1/skills/challenges` | Loads skills and entrepreneurship challenges. |
| `GET /api/v1/skills/challenges/:challengeId` | Loads challenge steps. |
| `GET /api/v1/students/me/skills/projects` | Restores the student's completed challenge steps. |
| `PUT /api/v1/students/me/skills/projects/:challengeId` | Saves challenge step progress. |
| `GET /api/v1/students/me/points` | Loads points balance, tier, and next-tier progress. |
| `GET /api/v1/students/me/points/transactions` | Loads earned-points history. |
| `GET /api/v1/opportunities` | Loads sample opportunity listings, with optional type filters. |
| `GET /api/v1/opportunities/:opportunityId` | Loads opportunity details. |
| `GET /api/v1/opportunities/me/saved` | Loads the student's saved opportunity IDs. |
| `PUT /api/v1/opportunities/me/saved/:opportunityId` | Saves an opportunity. |
| `DELETE /api/v1/opportunities/me/saved/:opportunityId` | Removes a saved opportunity. |
| `GET /api/v1/students/me/guardian-invitations` | Loads invitation status and expiration dates. |
| `POST /api/v1/students/me/guardian-invitations` | Creates a one-time code to share with a guardian. |
| `DELETE /api/v1/students/me/guardian-invitations/:invitationId` | Revokes an active invitation code. |
| `GET /api/v1/health` | Backend health endpoint; the frontend does not call it automatically. |

The authentication token is stored in browser local storage under `coupreshfund.authToken` and is included in authenticated requests. The backend issues a token that expires after one day. Registration and sign-in errors are displayed in the interface.

## Product screens and data status

The authentication token is restored from `/api/v1/auth/me` on reload, and dashboard/product routes require a signed-in student. Onboarding data is saved at completion and restored with the student profile. The My Money goals form updates the saved graduation target and purpose; the budget screen loads and saves amounts independently for each period, records expenses, and displays the actual category breakdown and remaining budget.

Self-reported savings and expenses do not initiate, verify, or move money. Learning Hub progress, skills challenge steps, earned points, saved opportunities, and invite-code status are persisted by the backend. Opportunity entries are sample listings and should be verified with providers. Guardian invite acceptance, guardian accounts, and guardian access to student data are not enabled yet.

## Main routes

| Route | Screen |
| --- | --- |
| `/` | Welcome and onboarding |
| `/privacy` | Privacy Policy |
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
