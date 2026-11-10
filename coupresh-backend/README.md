# CouPreshFund Backend

Express API backed by PostgreSQL and Sequelize.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer

## Local setup

1. Create a PostgreSQL database and user.
2. Copy `.env.example` to `.env` and set your local database credentials and a private JWT secret.
3. Install dependencies with `npm ci`.
4. Start the API with `npm start`.

The server validates its required environment variables before starting. It checks the PostgreSQL connection and synchronizes the Sequelize models before listening. Startup failures are logged and cause a non-zero process exit.

Never commit `.env` or use credentials copied from another branch. Keep `.env.example` limited to placeholder values.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port; defaults to `5000` |
| `CORS_ORIGINS` | No | Comma-separated browser origins allowed to call the API; defaults to local Vite origins |
| `DB_NAME` | Yes | PostgreSQL database name |
| `DB_USER` | Yes | PostgreSQL user |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port |
| `JWT_SECRET` | Yes | Private secret used to sign authentication tokens |

Use a long, randomly generated `JWT_SECRET` in local and deployed environments.
For deployment, set `CORS_ORIGINS` to the exact frontend origin (for example, `https://your-site.onrender.com`) and include local origins only if local browser development is needed. Native mobile API requests do not rely on browser CORS.

## API

All routes are versioned under `/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Liveness check; confirms the API process is responding |
| `GET` | `/api/v1/health/ready` | Readiness check; confirms PostgreSQL is reachable |
| `POST` | `/api/v1/auth/register` | Register a student with email or phone |
| `POST` | `/api/v1/auth/login` | Sign in and receive a JWT |
| `GET` | `/api/v1/auth/me` | Return the authenticated student; requires a Bearer token |
| `GET` | `/api/v1/students/me/onboarding` | Return the authenticated student's saved onboarding profile |
| `PUT` | `/api/v1/students/me/onboarding` | Create or update school, graduation goal, and savings plan details |
| `PUT` | `/api/v1/students/me/goal` | Save the graduation goal and complete onboarding profile from the editable Goals form |
| `GET` | `/api/v1/students/me/dashboard` | Return the authenticated student's profile, goal progress, savings total, plan equivalent, and recent contributions |
| `GET` | `/api/v1/students/me/contributions` | List the authenticated student's self-reported contributions; optional `limit` is 1-50 (default 20) |
| `POST` | `/api/v1/students/me/contributions` | Record a self-reported contribution |
| `GET` | `/api/v1/students/me/budgets` | List the authenticated student's saved budgets |
| `PUT` | `/api/v1/students/me/budgets/:period` | Create or update a budget for `weekly`, `monthly`, or `yearly` |
| `GET` | `/api/v1/students/me/expenses?period=monthly` | Return expenses and category totals for the current weekly, monthly, or yearly period |
| `POST` | `/api/v1/students/me/expenses` | Record an expense for the authenticated student |
| `GET` | `/api/v1/learning/lessons` | List available financial literacy lessons |
| `GET` | `/api/v1/learning/lessons/:lessonId` | Return lesson detail and original learning content |
| `GET` | `/api/v1/students/me/learning/progress` | Return the authenticated student's lesson progress |
| `PUT` | `/api/v1/students/me/learning/progress/:lessonId` | Save lesson progress from 0 to 100 percent |
| `GET` | `/api/v1/skills/challenges` | List available skills and entrepreneurship challenges |
| `GET` | `/api/v1/skills/challenges/:challengeId` | Return challenge details and steps |
| `GET` | `/api/v1/students/me/skills/projects` | Return the authenticated student's project progress |
| `PUT` | `/api/v1/students/me/skills/projects/:challengeId` | Save completed challenge steps |
| `GET` | `/api/v1/students/me/points` | Return points balance, tier, and progress to the next tier |
| `GET` | `/api/v1/students/me/points/transactions` | List earned-point transactions |
| `GET` | `/api/v1/opportunities?type=Scholarships` | Browse opportunities, optionally filtered by type |
| `GET` | `/api/v1/opportunities/:opportunityId` | Return opportunity details |
| `GET` | `/api/v1/opportunities/me/saved` | List saved opportunities for the authenticated student |
| `PUT` | `/api/v1/opportunities/me/saved/:opportunityId` | Save an opportunity |
| `DELETE` | `/api/v1/opportunities/me/saved/:opportunityId` | Remove a saved opportunity |
| `GET` | `/api/v1/students/me/guardian-invitations` | List invitation status and expiration dates |
| `POST` | `/api/v1/students/me/guardian-invitations` | Create a one-time guardian invite code |
| `DELETE` | `/api/v1/students/me/guardian-invitations/:invitationId` | Revoke an active invite code |

Errors use JSON responses with a `message` field. Internal server errors do not return implementation or database details.

The onboarding request uses the frontend fields `institution`, `course`, `level`, `graduationYear`, `goalAmount`, `purpose`, `contribution`, and `cadence`. It requires all fields; amounts are whole Naira values and cadence is `weekly`, `monthly`, or `yearly`.

The contribution request accepts a whole Naira `amount` of at least 100 and an optional `note` up to 250 characters. Contributions are self-reported records only; they do not represent verified deposits or trigger payment processing. The dashboard total and progress are calculated from these records.

The budget update request accepts a whole Naira `amount` greater than zero. Budgets are saved separately for each student and period. Goal edits use the goal `PUT` endpoint and submit the full onboarding profile, so school and savings-plan details can be edited in the same form or left unchanged.

Expense requests accept a positive whole Naira `amount`, a `category` (`essentials`, `learning`, `transport`, or `other`), an optional ISO `occurredOn` date (defaults to today), and an optional `note`. The summary covers the current calendar period; weeks start on Monday. Expenses are self-reported records and do not move money.

Lesson progress is private to the authenticated student and saved by stable lesson ID. Setting progress to 100 percent marks the lesson complete. Lesson content is bundled in the backend catalog.

Skills challenge progress is stored per student and persists the exact completed steps. Completing a lesson or challenge awards its points once; there is no client-controlled points-award endpoint. Tiers are Starter (0-199), Builder (200-850), Grower (851-1500), and Accelerator (1501+).

Opportunity records in this release are sample listings; verify details with their providers. Students can save and remove listings.

Guardian invite codes are random, expire after seven days, and are stored as hashes. Creating a replacement revokes the prior pending code. The current API supports issuing, listing, and revoking codes only; accepting invitations, guardian accounts, and access to student data are not enabled.

The `StudentProfile`, `SavingsContribution`, `StudentBudget`, `StudentExpense`, `StudentLessonProgress`, `StudentChallengeProgress`, `StudentPointTransaction`, `GuardianInvitation`, and `StudentOpportunitySave` Sequelize models are registered at startup. `sequelize.sync()` creates their PostgreSQL tables automatically if they do not exist. Since it does not alter existing tables when model columns change, startup also applies a narrow migration for the challenge `completedSteps` column; use deliberate migrations for future schema changes.

## Checks

Run the backend tests with `npm test`.

To also verify PostgreSQL table creation and the contribution, goal, and budget endpoints against the database configured in `.env`, use PowerShell:

```powershell
$env:RUN_DB_INTEGRATION_TESTS = '1'
npm run test:db
```

The database integration test calls `sequelize.sync()` and briefly creates a uniquely identified test student and related records. It removes those test records in a `finally` block. Use a development/test database, not production.
