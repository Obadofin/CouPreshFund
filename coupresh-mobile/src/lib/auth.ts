// Fake auth for now, so you can build every screen without a backend.
// When the backend engineer's API is ready, replace the body of each function
// with a real request (for example POST /api/v1/auth/login) and keep the names.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string; // can be empty
  password: string;
};

export async function login(email: string, password: string) {
  await wait(600);
}

export async function register(payload: RegisterPayload) {
  await wait(800);
}

export async function logout() {}