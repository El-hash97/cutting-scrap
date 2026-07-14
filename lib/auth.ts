/** Kredensial supervisor. Ganti nilai ini untuk mengubah login. */
const SUPERVISOR_USERNAME = "admin";
const SUPERVISOR_PASSWORD = "admin123";

export function checkSupervisorCredentials(
  username: string,
  password: string
): boolean {
  return username.trim() === SUPERVISOR_USERNAME && password === SUPERVISOR_PASSWORD;
}
