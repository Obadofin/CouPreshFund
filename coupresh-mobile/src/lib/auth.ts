// Fake login for now, so you can build all the screens without a backend.
// When your backend engineer's API is ready, replace the body with a real
// request (fetch to their /api/v1/auth/login endpoint) and keep the same function name.
export async function login(identifier: string, password: string) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  // Mock: any non-empty email/phone + password is accepted.
}