import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User, AlertCircle, ArrowLeft } from "lucide-react";
import { authAPI } from "./services/api";
import "./css/LoginPage.css";

// regex from https://stackoverflow.com/a/46181
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const MIN_PW_LEN = 8;

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [returningUser, setReturningUser] = useState(true);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [username, setUsername] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    //TODO: Doesnt work??
    // landing page "Get Started" link passes mode=signup via router state
    if (location.state?.mode === "signup") {
      setReturningUser(false);
      localStorage.removeItem("auth_token");
    }
  }, [location.state]);

  function validateFields() {
    if (!EMAIL_RE.test(email)) return "Not a valid email";
    if (pw.length < 8) return "Password needs to be at least 8 characters";
    // only check username when signing up
    if (!returningUser && !USERNAME_RE.test(username))
      return "Username must be 3-20 chars (letters, numbers, underscores)";
    return null;
  }

  const submitAuth = async (e) => {
    e.preventDefault();
    setFormError("");

    const problem = validateFields();
    if (problem) {
      setFormError(problem);
      return;
    }

    setBusy(true);
    try {
      const data = returningUser
        ? await authAPI.login(email, pw)
        : await authAPI.register(email, pw, username);
      onLogin(data.user);
    } catch (err) {
      // backend return
      setFormError(err.message || "Something went wrong, try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button
          onClick={() => navigate("/")}
          className="back-to-home-button"
          type="button"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h1 className="login-title">Meet me in the middle</h1>
        <p className="subtitle">Find the perfect meeting spot with friends!</p>

        <form onSubmit={submitAuth} className="login-form">
          {formError && (
            <div className="alert-error">
              <AlertCircle size={20} />
              <span>{formError}</span>
            </div>
          )}

          {!returningUser && (
            <div className="form-group">
              <label>
                <User size={16} />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. helmut34"
                disabled={busy}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              disabled={busy}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} />
              Password
            </label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              disabled={busy}
              required
              minLength={MIN_PW_LEN}
            />
          </div>

          <button type="submit" className="submit-button" disabled={busy}>
            {busy ? "Hang on..." : returningUser ? "Sign In" : "Create Account"}
          </button>

          <div className="toggle-mode">
            {returningUser
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setReturningUser(!returningUser);
                setFormError("");
                setUsername("");
              }}
              className="toggle-button"
              disabled={busy}
            >
              {returningUser ? "Sign up" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
