"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserData } from "@/contexts/UserContext";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, registerAccount, lookupAccount } = useUser();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<UserData[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  const passwordStrength = useCallback((pw: string) => {
    if (pw.length === 0) return { level: 0, label: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    return { level: score, label: labels[score] };
  }, []);

  const strength = mode === "signup" ? passwordStrength(password) : { level: 0, label: "" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (mode === "signup" && !name) {
      setError("Please enter your full name.");
      return;
    }

    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);

    if (mode === "signup") {
      // Parse full name into first + last
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const newUser = {
        firstName,
        lastName,
        email: email.trim(),
        mobile: "",
        role: "Member",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Save to accounts registry so sign-in can recall it later
      registerAccount(newUser);
      setUser(newUser);
    } else {
      // Sign-in: look up previously registered account first
      const existing = lookupAccount(email.trim());

      if (existing) {
        // Restore the full profile from when they signed up
        setUser(existing);
      } else {
        setError("User not found or invalid credentials. Please create an account.");
        return;
      }
    }

    // Navigate to dashboard on success
    router.push("/dashboard");
  };

  const toggleMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
    setPassword("");
  };

  const handleSocialLogin = (provider: string) => {
    setSelectedProvider(provider);
    try {
      const raw = localStorage.getItem("metricflow_accounts");
      let accountsList: UserData[] = [];
      if (raw) {
        const accountsObj = JSON.parse(raw);
        accountsList = Object.values(accountsObj) as UserData[];
      }
      
      // If no local accounts exist, provide a mock signed-in option
      if (accountsList.length === 0) {
        accountsList.push({
          firstName: provider,
          lastName: "User",
          email: `demo@${provider.toLowerCase()}.com`,
          mobile: "",
          role: "Member",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }

      // deduplicate accounts by email just in case
      const uniqueAccounts = accountsList.filter((acc, index, self) =>
        index === self.findIndex((a) => a.email === acc.email)
      );
      setAvailableAccounts(uniqueAccounts);
    } catch {
      setAvailableAccounts([]);
    }
    setShowAccountSelector(true);
  };

  const handleAccountSelect = (account: UserData) => {
    setUser(account);
    router.push("/dashboard");
  };

  return (
    <div className="login">
      {/* Animated background orbs */}
      <div className="login__bg" aria-hidden="true">
        <div className="login__orb login__orb--1" />
        <div className="login__orb login__orb--2" />
        <div className="login__orb login__orb--3" />
      </div>

      <div className="login__container">
        {/* Brand */}
        <div className="login__brand">
          <div className="login__brand-icon">◆</div>
          <div>
            <h1 className="login__brand-name">
              Metric<span>Flow</span>
            </h1>
            <p className="login__brand-tagline">Analytics dashboard</p>
          </div>
        </div>

        {/* Card */}
        <div className="login__card">
          {/* Tabs */}
          <div className="login__tabs" role="tablist">
            <button
              className={`login__tab ${mode === "signin" ? "login__tab--active" : ""}`}
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              id="tab-signin"
              onClick={() => { setMode("signin"); setError(""); setPassword(""); }}
            >
              Sign In
            </button>
            <button
              className={`login__tab ${mode === "signup" ? "login__tab--active" : ""}`}
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              id="tab-signup"
              onClick={() => { setMode("signup"); setError(""); setPassword(""); }}
            >
              Sign Up
            </button>
            <div
              className="login__tab-indicator"
              style={{ transform: mode === "signup" ? "translateX(100%)" : "translateX(0)" }}
            />
          </div>

          {/* Header */}
          <div className="login__header">
            <h2 className="login__title">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="login__subtitle">
              {mode === "signin"
                ? "Sign in to access your metrics dashboard"
                : "Get started with MetricFlow for free"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="login__error" role="alert">
              <span className="login__error-icon">⚠</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form className="login__form" onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <div className="login__field">
                <label className="login__label" htmlFor="login-name">
                  Full Name
                </label>
                <div className="login__input-wrapper">
                  <span className="login__input-icon">👤</span>
                  <input
                    className="login__input"
                    id="login-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="login__field">
              <label className="login__label" htmlFor="login-email">
                Email Address
              </label>
              <div className="login__input-wrapper">
                <span className="login__input-icon">✉</span>
                <input
                  className="login__input"
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="login__field">
              <label className="login__label" htmlFor="login-password">
                Password
              </label>
              <div className="login__input-wrapper">
                <span className="login__input-icon">🔒</span>
                <input
                  className="login__input"
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  disabled={isLoading}
                />
                <button
                  className="login__toggle-pw"
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>

              {/* Password strength (signup only) */}
              {mode === "signup" && password.length > 0 && (
                <div className="login__strength">
                  <div className="login__strength-bar">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`login__strength-seg ${
                          i <= strength.level ? `login__strength-seg--l${strength.level}` : ""
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`login__strength-label login__strength-label--l${strength.level}`}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {mode === "signin" && (
              <div className="login__extras">
                <label className="login__remember">
                  <input type="checkbox" className="login__checkbox" />
                  <span className="login__checkmark" />
                  Remember me
                </label>
                <button className="login__forgot" type="button">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              className="login__submit"
              type="submit"
              disabled={isLoading}
              id="login-submit"
            >
              {isLoading ? (
                <span className="login__spinner" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login__divider">
            <span>or continue with</span>
          </div>

          {/* Social buttons */}
          <div className="login__socials">
            <button className="login__social" type="button" id="login-google" onClick={() => handleSocialLogin("Google")}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 33.4 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.6-11.3-8.4l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.2-2.7-.4-3.9z"/>
              </svg>
              Google
            </button>
            <button className="login__social" type="button" id="login-github" onClick={() => handleSocialLogin("GitHub")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
            <button className="login__social" type="button" id="login-facebook" onClick={() => handleSocialLogin("Facebook")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
            <button className="login__social" type="button" id="login-yahoo" onClick={() => handleSocialLogin("Yahoo")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6001D2">
                <path d="M22.548 4.298l-7.796 11.205v7.697h-4.621v-7.697L2.146 4.298h5.362l4.908 7.844 4.881-7.844h5.251z"/>
              </svg>
              Yahoo
            </button>
          </div>

          {/* Mode switch */}
          <p className="login__switch">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            <button className="login__switch-btn" type="button" onClick={toggleMode}>
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        {/* Account Selection Overlay */}
        {showAccountSelector && (
          <div className="login__modal-overlay">
            <div className="login__modal">
              <div className="login__modal-header">
                <h3 className="login__modal-title">Sign in with {selectedProvider}</h3>
                <button 
                  className="login__modal-close" 
                  onClick={() => setShowAccountSelector(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              
              <div className="login__account-list">
                {availableAccounts.length > 0 ? (
                  availableAccounts.map((account, idx) => (
                    <button 
                      key={idx} 
                      className="login__account-item"
                      onClick={() => handleAccountSelect(account)}
                    >
                      <div className="login__account-avatar">
                        {(account.firstName[0] || "") + (account.lastName?.[0] || "")}
                      </div>
                      <div className="login__account-info">
                        <span className="login__account-name">{account.firstName} {account.lastName}</span>
                        <span className="login__account-email">{account.email}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="login__account-empty">
                    No registered accounts found. <br/> Please sign up first or use manual login.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="login__footer">
          © 2026 MetricFlow · <button type="button" className="login__footer-link">Privacy</button> · <button type="button" className="login__footer-link">Terms</button>
        </p>
      </div>
    </div>
  );
}
