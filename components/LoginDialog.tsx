"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { checkSupervisorCredentials } from "@/lib/auth";
import { setRole } from "@/lib/storage";

export default function LoginDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setUsername("");
    setPassword("");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (checkSupervisorCredentials(username, password)) {
      setRole("Supervisor");
      onClose();
      return;
    }
    setError("Username atau password salah.");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-border bg-surface p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-bold text-foreground">
          Login Supervisor
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Username" htmlFor="login-username">
            <input
              id="login-username"
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </Field>
          <Field label="Password" htmlFor="login-password" error={error}>
            <input
              id="login-password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Masuk
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
