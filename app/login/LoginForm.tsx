"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">
          E-post
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          className="field"
          placeholder="admin@arvemaa.ee"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Parool
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="field"
          placeholder="••••••••"
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button className="btn btn-primary w-full py-2.5" disabled={pending}>
        {pending ? "Sisenen…" : "Logi sisse"}
      </button>
    </form>
  );
}
