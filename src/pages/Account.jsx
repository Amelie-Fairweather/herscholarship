import { useState } from "react";
import { Field } from "../components/Bits";
import { authMessage, supabase } from "../lib/supabase";

function emailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function phoneOk(value) {
  return String(value || "").replace(/\D/g, "").length >= 10;
}

export default function Account({ mode, go, account }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    verify: "",
  });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function create(event) {
    event.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = "Add your name.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.verify !== form.password) next.verify = "Those passwords do not match.";
    if (!emailOk(form.email)) next.email = "Add a real email address.";
    if (!phoneOk(form.phone)) next.phone = "Add a phone number, with the area code.";
    setErrors(next);
    setNotice("");
    if (Object.keys(next).length) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: form.name.trim(), phone: form.phone.trim() },
      },
    });
    setBusy(false);
    if (error) {
      setErrors({ email: authMessage(error) });
      return;
    }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setErrors({ email: "That email already has an account. Log in instead." });
      return;
    }
    if (!data.session) {
      setNotice(form.email.trim());
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    go("#story");
  }

  async function login(event) {
    event.preventDefault();
    const email = form.email.trim();
    if (!emailOk(email)) {
      setErrors({ email: "Add the email on the account." });
      return;
    }
    if (!form.password) {
      setErrors({ password: "Add the password for this account." });
      return;
    }
    setBusy(true);
    setNotice("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: form.password });
    setBusy(false);
    if (error) {
      const message = authMessage(error);
      setErrors(/confirm/i.test(message) ? { email: message } : { password: message });
      return;
    }
    go("#story");
  }

  if (mode === "login") {
    return (
      <div className="page">
        <form className="wrap auth-card" onSubmit={login} noValidate>
          <p className="eyebrow">Welcome back</p>
          <h1>Log in.</h1>
          <p className="lede">Use the email and password on your account.</p>
          <Field id="login-email" label="Email" error={errors.email}>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </Field>
          <Field id="login-password" label="Password" error={errors.password}>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => set("password", event.target.value)}
            />
          </Field>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Logging in" : "Log in"}
          </button>
          <button type="button" className="btn-text" onClick={() => go("#create")}>
            Create an account
          </button>
          {account ? <p className="hint">You are already in as {account.name}.</p> : null}
        </form>
      </div>
    );
  }

  if (notice) {
    return (
      <div className="page">
        <section className="wrap auth-card account-sent" role="status">
          <p className="eyebrow">Check your email</p>
          <h1>Confirm your account.</h1>
          <p className="lede">
            We sent a confirmation link to the address below. Open that email and confirm, then come back and log in.
          </p>
          <p className="sent-email">{notice}</p>
          <button type="button" className="btn btn-primary" onClick={() => go("#login")}>
            Log in
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <form className="wrap auth-card" onSubmit={create} noValidate>
        <p className="eyebrow">Seniors only</p>
        <h1>Create account.</h1>
        <p className="lede">Name, email, phone, and a password. The account is saved in Supabase.</p>
        <Field id="acct-name" label="Name" error={errors.name}>
          <input
            id="acct-name"
            autoComplete="name"
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
          />
        </Field>
        <Field id="acct-password" label="Password" error={errors.password}>
          <input
            id="acct-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => set("password", event.target.value)}
          />
        </Field>
        <Field id="acct-verify" label="Verify password" error={errors.verify}>
          <input
            id="acct-verify"
            type="password"
            autoComplete="new-password"
            value={form.verify}
            onChange={(event) => set("verify", event.target.value)}
          />
        </Field>
        <Field id="acct-email" label="Email" error={errors.email}>
          <input
            id="acct-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </Field>
        <Field id="acct-phone" label="Phone" error={errors.phone}>
          <input
            id="acct-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </Field>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Creating account" : "Create account"}
        </button>
        <button type="button" className="btn-text" onClick={() => go("#login")}>
          I already have an account
        </button>
      </form>
    </div>
  );
}

export function NeedAccount({ go, title, copy, primary = "Create account", primaryTo = "#create", secondary = "Log in", secondaryTo = "#login" }) {
  return (
    <div className="page">
      <section className="wrap auth-card">
        <p className="eyebrow">Senior account</p>
        <h1>{title}</h1>
        <p className="lede">{copy}</p>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => go(primaryTo)}>
            {primary}
          </button>
          {secondary ? (
            <button type="button" className="btn btn-ghost" onClick={() => go(secondaryTo)}>
              {secondary}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
