import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setTokens, getErrorMessage } from "../lib/api";
import "./style/Auth.css";

function Login() {
  const navigate = useNavigate();

  // Controlled form state so the submit handler can read the values.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // POST /auth/login -> { accessToken, refreshToken, user }
      const { data } = await api.post("/auth/login", { email, password });

      // Only treat the login as successful when the backend actually
      // returned tokens — otherwise (e.g. a proxy error page or a
      // placeholder server) we'd navigate without being logged in.
      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error("The server did not return a valid session.");
      }

      setTokens(data.accessToken, data.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      // Show the backend's message (e.g. "Invalid email or password").
      setError(getErrorMessage(err, "Login failed. Check your email and password."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-link">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>

      <div className="auth-container">
        <div className="auth-text-section">
          <h1>
            Welcome Back! Let's
            <br />
            Get Back to Managing.
          </h1>
          <p>
            Transform the way your team plans, collaborates,
            <br />
            and achieves success.
          </p>
        </div>

        <div className="auth-form-section">
          <div className="auth-form-card">
            <div className="logo-container">
              <img
                src="/assets/Landing-assets/Landing-assets/All-Logos/logo.svg"
                alt="Manag'it"
              />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Exemple@gmail.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="**************"
                    required
                    autoComplete="current-password"
                  />
                  <div className="input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Backend / network errors land here */}
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Logging in..." : "Login"}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              <div className="auth-switch">
                You don't have an account ?{' '}
                <Link to="/signup">Sign Up</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;