import { useEffect, useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { useChatStore } from "../lib/chatStore";
import { apiRequest } from "../lib/api";
import { useUserStore } from "../lib/userStore";

const getAuthErrorMessage = (err, fallback) => err?.data?.detail || err?.message || fallback;

function Login() {
  const [avatar, setAvatar] = useState({ file: null, url: "" });
  const [loading, setLoading] = useState(false);

  const { changeChat } = useChatStore();
  const { setAuth } = useUserStore();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleAvatar = (e) => {
    if (e.target.files?.[0]) {
      if (avatar.url) URL.revokeObjectURL(avatar.url);
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  useEffect(() => {
    return () => {
      if (avatar.url) URL.revokeObjectURL(avatar.url);
    };
  }, [avatar.url]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: {
          username: signupUsername.trim(),
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword,
          avatar: "",
        },
      });

      setAuth(result.token, result.user);
      toast.success("Account Created Successfully");
      changeChat(null, null);
    } catch (err) {
      toast.error(getAuthErrorMessage(err, "Authentication failed. Please try again."));
    } finally {
      setLoading(false);
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
          <button type="submit">{loading ? "Signing In..." : "Sign In"}</button>
        </form>
      </div>

      <div className="separator"></div>

      <div className="item">
        <h2>Create an account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "/images/profile.png"} alt="" /> Upload a file
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />

          <input
            type="text"
            placeholder="Username"
            value={signupUsername}
            onChange={(e) => setSignupUsername(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            required
          />
          <button type="submit">{loading ? "Signing Up..." : "Sign Up"}</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
