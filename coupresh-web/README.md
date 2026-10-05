# CouPreshFund Web

Mobile-first React frontend prototype for the CouPreshFund student financial empowerment platform.

## Setup

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Checks

```sh
npm run lint
npm run build
```

## Main Routes

| Route | Page |
| --- | --- |
| `/` | Welcome |
| `/login` | Sign-in preview |
| `/signup/details` | Student details |
| `/signup/campus` | Institution and graduation details |
| `/signup/goal` | Graduation goal and purpose |
| `/signup/savings-plan` | Contribution amount and cadence |
| `/signup/complete` | Profile summary |
| `/home` | Student dashboard |
| `/roadmap` | Savings milestones |
| `/goals` | Growth Unlock simulation |
| `/goals/invite` | Parent or guardian invite preview |
| `/learn` | Financial learning lessons |
| `/profile` | Student profile and mock logout |

## Project Structure

- `src/pages/` contains route-level screens.
- `src/components/` contains shared navigation, branding, and layout.
- `src/utils/` contains shared helpers.
- `src/App.jsx` defines routes and holds the in-memory student profile state.

## Prototype Limitations

This frontend is a UI prototype. Authentication, profile details, lesson progress, savings activity, invite codes, and dashboard values are mock data. No backend API or persistence is connected, and no money is moved or invested. Growth Unlock is an illustration only, not financial advice.

Do not enter real personal or financial information in this prototype.