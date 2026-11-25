# CouPreshFund Admin

Independent React/Vite admin application. It authenticates through the backend's admin-only API; there is no public admin registration page.

## Local development

1. Install dependencies with `npm ci`.
2. Start the backend and configure its `CORS_ORIGINS` to allow `http://localhost:5174`.
3. Start the admin app with `npm run dev`. The Vite server runs on port `5174` and proxies `/api` to `http://localhost:5000` by default. Override the proxy target with `VITE_BACKEND_ORIGIN`.
4. Provision the first `super_admin` with the backend's `npm run create-admin` script, then sign in.

## Deployment

Build with `npm run build` and deploy the `dist` directory as an independent static site, using a distinct admin URL from the student frontend. Set `VITE_API_BASE_URL` to the backend's full HTTPS API base ending in `/api/v1`, and allow the deployed admin origin in the backend's `CORS_ORIGINS`.

The admin app supports overview analytics, student account activation/suspension, learning content, milestones, inactivity campaign controls, guardian reward awards, and an audit log. Admin roles and authorization are enforced by the backend; hiding a page in the frontend is not used as an access-control boundary.
