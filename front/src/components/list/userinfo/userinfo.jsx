import "./userinfo.css";
import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { toast } from "react-toastify";
import { apiRequest } from "../../lib/api";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

function createImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Failed to load image")));
    image.src = source;
  });
}

async function getCroppedBlob(imageSrc, cropAreaPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = cropAreaPixels.width;
  canvas.height = cropAreaPixels.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image canvas");
  }

  context.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    cropAreaPixels.width,
    cropAreaPixels.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to crop image"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

function Userinfo() {
  const { currentUser, token, setAuth, logout } = useUserStore();
  const { resetChat } = useChatStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.about || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setUsername(currentUser?.username || "");
    setBio(currentUser?.about || "");
  }, [currentUser?.username, currentUser?.about]);

  const handleAvatarSelection = async (event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    try {
      const imageSrc = await readFileAsDataUrl(selectedFile);
      setCropImageSrc(imageSrc);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropModalOpen(true);
    } catch {
      toast.error("Failed to open selected image");
    }
  };

  const closeCropModal = () => {
    setCropModalOpen(false);
    setCropImageSrc("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const applyCroppedAvatar = async () => {
    if (!cropImageSrc || !croppedAreaPixels) {
      toast.error("Adjust image before applying");
      return;
    }

    try {
      const croppedBlob = await getCroppedBlob(cropImageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], `avatar-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      setAvatarFile(croppedFile);
      closeCropModal();
      toast.success("Image ready for profile update");
    } catch {
      toast.error("Failed to process image");
    }
  };

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
                onChange={handleAvatarSelection}
              />
              <label htmlFor="bio">Edit bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={255}
                placeholder="Write your bio..."
              />
              {avatarFile && <small className="fileHint">Image adjusted and selected</small>}
              <button type="button" onClick={handleUpdateProfile}>Save profile</button>
            </div>
          )}
        </div>
      </div>

      {cropModalOpen && (
        <div className="cropModalOverlay" onClick={closeCropModal}>
          <div className="cropModal" onClick={(e) => e.stopPropagation()}>
            <h3>Adjust profile photo</h3>
            <div className="cropArea">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>
            <label htmlFor="zoomRange" className="zoomLabel">Zoom</label>
            <input
              id="zoomRange"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <div className="cropActions">
              <button type="button" className="secondaryButton" onClick={closeCropModal}>Cancel</button>
              <button type="button" onClick={applyCroppedAvatar}>Apply</button>
            </div>
          </div>
        </div>
      )}

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
