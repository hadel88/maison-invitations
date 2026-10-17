import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { api } from "./client";
export default function AuthDialog({ onClose, onSuccess, Modal, Field }) {
  const [mode, setMode] = useState("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [recovery, setRecovery] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const reset = mode === "recover" || mode === "reset",
    signup = mode === "signup";
  function change(m) {
    setMode(m);
    setError("");
    setMessage("");
    setPassword("");
    setRecovery("");
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "recover") {
        await api("recover", { method: "POST", data: { email } });
        setMode("reset");
        setMessage(
          "If this account exists, a recovery email has been requested. It can take a few minutes. Copy the password reset button’s link from the email without opening it, then paste it below.",
        );
        return;
      }
      const d = await api(mode === "reset" ? "reset-password" : mode, {
        method: "POST",
        data: { email, password, ...(mode === "reset" ? { recovery } : {}) },
      });
      if (d.confirmation)
        setMessage(
          "Check your email to confirm your account, then return here to sign in. Email provider limits apply.",
        );
      else onSuccess(d.user);
    } catch (e) {
      setError(
        e.message === "Invalid login credentials"
          ? "The email or password did not match this Community app account. Check the spelling or use “Forgot password?”."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal className="auth-modal" onClose={onClose}>
      <span className="brand">maison</span>
      <span className="eyebrow">
        {reset ? "A FRESH START" : "YOUR BEAUTIFUL MOMENTS, ALL TOGETHER"}
      </span>
      <h2>
        {reset
          ? "Let’s get you back in."
          : signup
            ? "Let’s begin."
            : "Welcome back."}
      </h2>
      <p>
        {reset
          ? "Recover your shared Maison / Community account."
          : signup
            ? "Save and share the moments that matter."
            : "Sign in to continue your story."}
      </p>
      <form onSubmit={submit}>
        <Field
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        {mode === "reset" && (
          <label className="field">
            Password recovery link
            <textarea
              value={recovery}
              onChange={(e) => setRecovery(e.target.value)}
              rows={3}
              required
              autoComplete="off"
              placeholder="Paste the complete recovery link from your email"
            />
            <small>
              This sensitive link goes only to Maison and your Supabase
              authentication service. Don’t share it in chat.
            </small>
          </label>
        )}
        {mode !== "recover" && (
          <div className="password-field">
            <Field
              label={mode === "reset" ? "New password" : "Password"}
              type={visible ? "text" : "password"}
              value={password}
              onChange={setPassword}
              required
              minLength={signup || mode === "reset" ? 8 : 1}
              autoComplete={
                signup || mode === "reset" ? "new-password" : "current-password"
              }
            />
            <button
              className="password-eye"
              type="button"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        )}
        {mode === "login" && (
          <button
            type="button"
            className="forgot-password"
            onClick={() => change("recover")}
          >
            Forgot password?
          </button>
        )}
        {reset && (
          <div className="small-note">
            Changing this password changes it for both Maison and Community.
            Your Gmail and Vercel passwords are separate.
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
        <button className="btn primary" disabled={busy}>
          {busy ? (
            <Loader2 className="spin" size={15} />
          ) : mode === "recover" ? (
            <Mail size={15} />
          ) : null}
          {mode === "recover"
            ? "Email recovery link"
            : mode === "reset"
              ? "Set new password & sign in"
              : signup
                ? "Create account"
                : "Sign in"}
          <ArrowRight size={15} />
        </button>
      </form>
      {reset ? (
        <button className="auth-switch" onClick={() => change("login")}>
          <ArrowLeft size={12} /> Back to sign in
        </button>
      ) : (
        <button
          className="auth-switch"
          onClick={() => change(signup ? "login" : "signup")}
        >
          {signup
            ? "Already have an account? Sign in"
            : "New to Maison? Create an account"}
        </button>
      )}
      <small>
        Preview account service: Community Supabase. Essential session cookies
        only. Your Google and Vercel passwords are separate from this app.
      </small>
    </Modal>
  );
}
