import "./userinfo.css";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiRequest } from "../../lib/api";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";

function Userinfo() {
  const { currentUser, token, setAuth, logout } = useUserStore();
  const { resetChat } = useChatStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.about || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    setUsername(currentUser?.username || "");
    setBio(currentUser?.about || "");
  }, [currentUser?.username, currentUser?.about]);

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST", token });
    } catch {
      // Logout should proceed locally even if token is already invalid.
    }
    logout();
    resetChat();
    setMenuOpen(false);
  };

  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("about", bio.trim());
      if (avatarFile) {
        formData.append("avatar_file", avatarFile);
      }

      const result = await apiRequest("/auth/update-profile", {
        method: "POST",
        token,
        body: formData,
      });
      setAuth(token, result.user);
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview("");
      }
      toast.success("Profile updated");
      setMenuOpen(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Fill current and new password");
      return;
    }

    try {
      const result = await apiRequest("/auth/change-password", {
        method: "POST",
        token,
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });
      setAuth(result.token, result.user);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
      setInfoOpen(false);
    } catch (err) {
      toast.error(err?.message || "Failed to change password");
    }
  };

  return (
    <div className="userinfo">
      <div className="user">
        <img src={currentUser?.avatar || "/images/profile.png"} alt="avatar" className="avatar" />
        <h4>{currentUser?.username?.toUpperCase() || "USER"}</h4>

        <div className="imgs">
          <img
            src="/images/more.png"
            alt="more options"
            className="icon"
            onClick={() => setMenuOpen((prev) => !prev)}
          />
          <div className="statusWrap" title="Status">
            <span className="statusRing"></span>
            <span className="statusCenter"></span>
          </div>
          <img
            src="/images/info.png"
            alt="user info"
            className="icon"
            onClick={() => setInfoOpen(true)}
          />

          {menuOpen && (
            <div className="menuPanel">
              <button type="button" onClick={handleLogout}>Logout</button>
              <label htmlFor="username">Change username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="New username"
              />
              <label htmlFor="avatarFile">Upload image</label>
              <input
                id="avatarFile"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  setAvatarFile(selectedFile);
                  if (avatarPreview) {
                    URL.revokeObjectURL(avatarPreview);
                  }
                  setAvatarPreview(selectedFile ? URL.createObjectURL(selectedFile) : "");
                }}
              />
              <label htmlFor="bio">Edit bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={255}
                placeholder="Write your bio..."
              />
              {avatarFile && <small className="fileHint">Selected: {avatarFile.name}</small>}
              {avatarPreview && <img src={avatarPreview} alt="Preview" className="avatarPreview" />}
              <button type="button" onClick={handleUpdateProfile}>Save profile</button>
            </div>
          )}
        </div>
      </div>

      {infoOpen && (
        <div className="infoModalOverlay" onClick={() => setInfoOpen(false)}>
          <div className="infoModal" onClick={(e) => e.stopPropagation()}>
            <h3>Account Information</h3>
            <p><strong>Email:</strong> {currentUser?.email || "-"}</p>
            <p><strong>Password:</strong> ********</p>

            <label htmlFor="currentPassword">Current password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="modalActions">
              <button type="button" onClick={handleChangePassword}>Change password</button>
              <button type="button" onClick={() => setInfoOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Userinfo;
