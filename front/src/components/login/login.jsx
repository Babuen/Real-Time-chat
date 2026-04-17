import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { useChatStore } from "../lib/chatStore";
import { apiRequest } from "../lib/api";
import { useUserStore } from "../lib/userStore";

const getAuthErrorMessage = (err, fallback) => {
  if (err?.data?.detail) {
    return err.data.detail;
  }

  if (err?.data && typeof err.data === "object") {
    const firstMessage = Object.values(err.data)
      .flat()
      .filter(Boolean)[0];

    if (firstMessage) {
      return firstMessage;
    }
  }

  return err?.message || fallback;
};

function Login() {
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const { changeChat } = useChatStore();
  const { setAuth } = useUserStore();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupOtp, setSignupOtp] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        },
      });

      setAuth(result.token, result.user);
      toast.success("Login successful");
      changeChat(null, null);
    } catch (err) {
      toast.error(getAuthErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupLoading(true);

    try {
      const normalizedUsername = signupUsername.trim();
      const normalizedEmail = signupEmail.trim().toLowerCase();

      if (!otpSent) {
        await apiRequest("/auth/signup-otp/request", {
          method: "POST",
          body: {
            username: normalizedUsername,
            email: normalizedEmail,
          },
        });

        setOtpSent(true);
        toast.success("OTP sent to your email");
      } else {
        const result = await apiRequest("/auth/signup-otp/verify", {
          method: "POST",
          body: {
            username: normalizedUsername,
            email: normalizedEmail,
            otp: signupOtp.trim(),
            password: signupPassword,
          },
        });

        setAuth(result.token, result.user);
        toast.success("Account created successfully");
        changeChat(null, null);
      }
    } catch (err) {
      toast.error(getAuthErrorMessage(err, "Authentication failed. Please try again."));
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
          <button type="submit">{loginLoading ? "Signing In..." : "Sign In"}</button>
        </form>
      </div>

      <div className="separator"></div>

      <div className="item">
        <h2>Create an account</h2>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Username"
            value={signupUsername}
            onChange={(e) => {
              setSignupUsername(e.target.value);
              setOtpSent(false);
              setSignupOtp("");
              setSignupPassword("");
            }}
            required
          />
          <input
            type="text"
            placeholder="Email"
            value={signupEmail}
            onChange={(e) => {
              setSignupEmail(e.target.value);
              setOtpSent(false);
              setSignupOtp("");
              setSignupPassword("");
            }}
            required
          />
          {otpSent && (
            <input
              type="text"
              placeholder="Enter OTP"
              value={signupOtp}
              onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          )}
          {otpSent && (
            <input
              type="password"
              placeholder="Create Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
            />
          )}
          <button type="submit">
            {signupLoading
              ? otpSent
                ? "Verifying..."
                : "Sending OTP..."
              : otpSent
                ? "Verify OTP & Create Account"
                : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
