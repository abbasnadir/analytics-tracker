"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { validateApiKey } from "@/services/api";
import { useUser } from "@/contexts/UserContext";

function buildWorkspaceIdentity(workspaceName: string, tenantId: string, apiKey: string) {
  const safeName = workspaceName.trim() || tenantId || "MetricFlow Workspace";
  const parts = safeName.split(/\s+/);
  const firstName = parts[0] || "MetricFlow";
  const lastName = parts.slice(1).join(" ") || "Workspace";

  return {
    firstName,
    lastName,
    email: `${tenantId || "workspace"}@metricflow.local`,
    mobile: "",
    role: "Workspace Owner",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    apiKey,
    tenantId,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const [workspaceName, setWorkspaceName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!apiKey.trim()) {
      setError("Enter the backend API key used by MetricFlow.");
      return;
    }

    setIsLoading(true);

    try {
      const health = await validateApiKey(apiKey.trim());
      const tenantId = health.tenantId || apiKey.trim();
      login(buildWorkspaceIdentity(workspaceName, tenantId, apiKey.trim()));
      router.push("/dashboard");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Could not validate that API key against the backend.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login__bg" aria-hidden="true">
        <div className="login__orb login__orb--1" />
        <div className="login__orb login__orb--2" />
        <div className="login__orb login__orb--3" />
      </div>

      <div className="login__container">
        <div className="login__brand">
          <div className="login__brand-icon">◆</div>
          <div>
            <h1 className="login__brand-name">
              Metric<span>Flow</span>
            </h1>
            <p className="login__brand-tagline">Backend-connected analytics dashboard</p>
          </div>
        </div>

        <div className="login__card">
          <div className="login__header">
            <h2 className="login__title">Connect your workspace</h2>
            <p className="login__subtitle">
              Sign in with a real MetricFlow API key. The dashboard will validate it
              against the backend before loading analyzer metrics.
            </p>
          </div>

          {error && (
            <div className="login__error" role="alert">
              <span className="login__error-icon">!</span>
              {error}
            </div>
          )}

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <div className="login__field">
              <label className="login__label" htmlFor="workspace-name">
                Workspace Name
              </label>
              <div className="login__input-wrapper">
                <span className="login__input-icon">#</span>
                <input
                  className="login__input"
                  id="workspace-name"
                  type="text"
                  placeholder="Acme Analytics"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="login__field">
              <label className="login__label" htmlFor="workspace-api-key">
                API Key
              </label>
              <div className="login__input-wrapper">
                <span className="login__input-icon">*</span>
                <input
                  className="login__input"
                  id="workspace-api-key"
                  type="password"
                  placeholder="mf_demo_key"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </div>

            <button
              className="login__submit"
              type="submit"
              disabled={isLoading}
              id="login-submit"
            >
              {isLoading ? <span className="login__spinner" /> : "Connect Dashboard"}
            </button>
          </form>

          <div className="login__divider">
            <span>Backend auth</span>
          </div>

          <p className="login__switch" style={{ marginBottom: 0 }}>
            Use the same key configured for the SDK and analyzer.
          </p>
        </div>

        <p className="login__footer">
          © 2026 MetricFlow · Analyzer-backed dashboard session
        </p>
      </div>
    </div>
  );
}
