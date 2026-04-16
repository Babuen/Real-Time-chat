import { useState } from "react";
import { toast } from "react-toastify";
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from "../lib/userStore";
import { apiRequest } from "../lib/api";
import "./details.css";

function Details() {
  const [blocking, setBlocking] = useState(false);
  const { user: selectedUser, chatId, changeChat } = useChatStore();
  const { currentUser, token, logout } = useUserStore();

  const currentUserId = currentUser?.id || currentUser?.uid;
  const selectedUserId = selectedUser?.id || selectedUser?.uid;
  const isBlocked = Boolean(selectedUserId && currentUser?.blocked?.includes(selectedUserId));

  const handleBlockToggle = async () => {
    if (!currentUserId || !selectedUserId || blocking) return;

    setBlocking(true);
    try {
      const result = await apiRequest(`/users/${selectedUserId}/block-toggle`, {
        method: "POST",
        token,
      });

      const nextBlocked = result.blockedIds || [];

      useUserStore.setState({
        currentUser: {
          ...currentUser,
          blocked: nextBlocked,
        },
      });

      changeChat(chatId, {
        ...selectedUser,
        blocked: selectedUser?.blocked || [],
      });

      toast.success(isBlocked ? "User unblocked" : "User blocked");
    } catch (err) {
      console.error("Failed to update block list:", err);
      toast.error(err?.message || "Could not update block status");
    } finally {
      setBlocking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST", token });
    } catch {
      // Local logout should still run even if token is already invalid.
    }
    logout();
    changeChat(null, null);
  };

  return (
    <div className="details">
      <div className="user">
        <img src={selectedUser?.avatar || "/images/profile2.png"} alt="" />
        <h3>{selectedUser?.username || "Unknown User"}</h3>
        <p>{selectedUser?.about || "No bio yet"}</p>
      </div>

      <div className="info">
        <div className="option">
          <div className="title">
            <p>Chat Settings</p>
            <img src="/images/arrowUp.png" className="arrow" alt="" />
          </div>
        </div>

        <div className="option">
          <div className="title">
            <p>Privacy & Help</p>
            <img src="/images/arrowUp.png" alt="" className="arrow" />
          </div>
        </div>

        <div className="option">
          <div style={{ marginBottom: "20px" }} className="title">
            <p>Shared Photos</p>
            <img src="/images/arrowUp.png" className="arrow" alt="" />
          </div>
        </div>

        <button onClick={handleBlockToggle} disabled={blocking || !selectedUserId}>
          {blocking ? "Please wait..." : isBlocked ? "Unblock User" : "Block User"}
        </button>

        <button className="logoutBtn" onClick={handleLogout}>
          LogOut
        </button>
      </div>
    </div>
  );
}

export default Details;
