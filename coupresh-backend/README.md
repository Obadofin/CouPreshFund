# CouPreshFund Backend

Express API backed by PostgreSQL and Sequelize.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer

## Local setup

1. Create a PostgreSQL database and user.
2. Copy `.env.example` to `.env` and set your local database credentials, a private JWT secret, and Gmail SMTP settings for email verification.
3. Install dependencies with `npm ci`.
4. Start the API with `npm start`.

The server validates its required database and JWT environment variables before starting. Email registration requires a Gmail App Password and a sender address matching the authenticated Gmail account. It checks the PostgreSQL connection and synchronizes the Sequelize models before listening. Startup failures are logged and cause a non-zero process exit.

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
| `SMTP_HOST` | For email registration | SMTP server; use `smtp.gmail.com` |
| `SMTP_PORT` | For email registration | SMTP port; use `465` for SSL or `587` for STARTTLS |
| `SMTP_USER` | For email registration | Gmail account used to authenticate |
| `SMTP_APP_PASSWORD` | For email registration | Google App Password; keep private |
| `EMAIL_FROM` | For email registration | Sender name and the same Gmail address as `SMTP_USER` |

Use a long, randomly generated `JWT_SECRET` in local and deployed environments.
For deployment, set `CORS_ORIGINS` to the exact frontend origin (for example, `https://your-site.onrender.com`) and include local origins only if local browser development is needed. Native mobile API requests do not rely on browser CORS.

## API

All routes are versioned under `/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Liveness check; confirms the API process is responding |
| `GET` | `/api/v1/health/ready` | Readiness check; confirms PostgreSQL is reachable |
| `POST` | `/api/v1/auth/register` | Create a pending student account and email a verification code |
| `POST` | `/api/v1/auth/verify-email` | Verify an email with its six-digit code and activate the account |
| `POST` | `/api/v1/auth/resend-verification` | Resend a code to a pending account; limited to one email per minute |
| `POST` | `/api/v1/auth/forgot-password` | Request a password-reset code; response does not reveal whether the account exists |
| `POST` | `/api/v1/auth/reset-password` | Change a password with the six-digit email code |
| `POST` | `/api/v1/auth/login` | Sign in and receive a JWT, or a verification-required response for an unverified student |
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
| `POST` | `/api/v1/guardian-auth/register` | Create a guardian account using a student invite code and send email verification |
| `POST` | `/api/v1/guardian-auth/verify-email` | Verify a new guardian account and link the invitation |
| `POST` | `/api/v1/guardian-auth/resend-verification` | Resend guardian email verification code |
| `POST` | `/api/v1/guardian-auth/login` | Sign in to an existing verified guardian account |
| `POST` | `/api/v1/guardian-auth/accept-invitation` | Link a signed-in guardian account using a student's invite code |

Errors use JSON responses with a `message` field. Internal server errors do not return implementation or database details.

Registration requires a valid email address. A phone number is optional; when supplied, it must be a valid Nigerian number in `08012345678` or `+2348012345678` format. New accounts remain inactive until the six-digit code sent by Gmail SMTP to their email is verified. Codes expire after 10 minutes, allow at most five incorrect attempts, and can be resent once per minute. No development or QA mode returns OTPs to clients; local, QA, and production registrations all use real email delivery. No SMS verification is performed.

Existing students can sign in with their email and password to reach a restricted dashboard verification screen if they have not completed the new email-verification flow. This includes older accounts, which are identified by having no verification timestamp. They can request a code and verify without registering again; dashboard features remain unavailable until verification succeeds.

Password recovery starts with `POST /api/v1/auth/forgot-password` using `{ "email": "..." }`. The backend returns the same response for known and unknown email addresses. If the account exists, it emails a six-digit code that expires after 10 minutes; requests are limited to one email per minute. Complete the reset with `POST /api/v1/auth/reset-password` using `{ "email": "...", "code": "123456", "newPassword": "..." }`. Codes are stored as keyed hashes, allow at most five incorrect attempts, and are cleared after a successful password change. New passwords must be at least eight characters and contain a letter and a number.

Enable 2-Step Verification on the Gmail account and create an App Password for this backend. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_APP_PASSWORD`, and `EMAIL_FROM` in the backend environment. Use the same Gmail address for `SMTP_USER` and `EMAIL_FROM`. Keep the App Password only in backend environment variables, never in frontend code or logs.

For hosted QA, use separate QA frontend/backend services and a separate QA database in Render. Configure the QA backend with its own `CORS_ORIGINS`, QA database variables, Gmail SMTP settings, and App Password; point the QA frontend at the QA backend. Testers register with inboxes they can access and receive the OTP by email. Keep production and QA data isolated, and store the App Password only in backend environment variables, never in the frontend.

The onboarding request uses the frontend fields `institution`, `course`, `level`, `graduationYear`, `goalAmount`, `purpose`, `contribution`, and `cadence`. It requires all fields; amounts are whole Naira values and cadence is `weekly`, `monthly`, or `yearly`.

The contribution request accepts a whole Naira `amount` of at least 100 and an optional `note` up to 250 characters. Contributions are self-reported records only; they do not represent verified deposits or trigger payment processing. The dashboard total and progress are calculated from these records.

The budget update request accepts a whole Naira `amount` greater than zero. Budgets are saved separately for each student and period. Goal edits use the goal `PUT` endpoint and submit the full onboarding profile, so school and savings-plan details can be edited in the same form or left unchanged.

Expense requests accept a positive whole Naira `amount`, a `category` (`essentials`, `learning`, `transport`, or `other`), an optional ISO `occurredOn` date (defaults to today), and an optional `note`. The summary covers the current calendar period; weeks start on Monday. Expenses are self-reported records and do not move money.

Lesson progress is private to the authenticated student and saved by stable lesson ID. Setting progress to 100 percent marks the lesson complete. Lesson content is bundled in the backend catalog.

Skills challenge progress is stored per student and persists the exact completed steps. Completing a lesson or challenge awards its points once; there is no client-controlled points-award endpoint. Tiers are Starter (0-199), Builder (200-850), Grower (851-1500), and Accelerator (1501+).

Opportunity records in this release are sample listings; verify details with their providers. Students can save and remove listings.

Guardian invite codes are random, expire after seven days, and are stored as hashes. Creating a replacement revokes the prior pending code. Guardians can create an account with the code and verify their email, or sign in to an existing verified guardian account and redeem the code at `/guardian/invite?code=...`. Redemption is one-time and recorded on the invitation. Guardian and student access tokens are separate; linking confirms the relationship only. Guardians do not have access to student profile or dashboard data in this release.

The `StudentProfile`, `SavingsContribution`, `StudentBudget`, `StudentExpense`, `StudentLessonProgress`, `StudentChallengeProgress`, `StudentPointTransaction`, `Guardian`, `GuardianInvitation`, and `StudentOpportunitySave` Sequelize models are registered at startup. `sequelize.sync()` creates their PostgreSQL tables automatically if they do not exist. Since it does not alter existing tables when model columns change, startup also applies narrow migrations for the email verification and password reset fields, challenge `completedSteps`, and invitation `guardianId`; use deliberate migrations for future schema changes.

## Checks

Run the backend tests with `npm test`.

To also verify PostgreSQL table creation and the contribution, goal, and budget endpoints against the database configured in `.env`, use PowerShell:

```powershell
$env:RUN_DB_INTEGRATION_TESTS = '1'
npm run test:db
```

The database integration test calls `sequelize.sync()` and briefly creates a uniquely identified test student and related records. It removes those test records in a `finally` block. Use a development/test database, not production.
