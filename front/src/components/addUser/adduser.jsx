import "./addUser.css";
import { useState } from "react";
import { useUserStore } from "../lib/userStore";
import { useChatStore } from "../lib/chatStore";
import { toast } from "react-toastify";
import { apiRequest } from "../lib/api";

function AddUser({ onDone }) {
  const [user, setUser] = useState(null);
  const { currentUser, token } = useUserStore();
  const { changeChat } = useChatStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const searchTerm = e.target.username.value.trim();
    const normalizedSearchTerm = searchTerm.toLowerCase();

    if (!searchTerm) return;

    try {
      const result = await apiRequest(`/users/search?q=${encodeURIComponent(normalizedSearchTerm)}`, { token });
      const foundUser = result.results?.[0] || null;

      if (!foundUser) {
        setUser(null);
        toast.error("User not found");
        onDone?.();
        return;
      }

      const currentUserId = currentUser?.id || currentUser?.uid;
      if (foundUser.id === currentUserId) {
        setUser(null);
        toast.info("You cannot add yourself");
        return;
      }

      setUser(foundUser);
    } catch (err) {
      console.error("Search error:", err);
      toast.error(err?.message || "Search failed");
    }
  };

  const handleAdd = async () => {
    if (!user || !currentUser) return;

    try {
      const result = await apiRequest("/chats/create", {
        method: "POST",
        token,
        body: { receiver_id: user.id },
      });

      toast.success("Chat created successfully");
      changeChat(result.chat.chatId, {
        id: user.id,
        username: user.username,
        about: user.about || "",
        avatar: user.avatar || "/images/profile2.png",
        blocked: user.blocked || [],
      });
      setUser(null);
      onDone?.();
    } catch (err) {
      console.error("Error adding chat:", err);
      toast.error(err?.message || "Failed to create chat");
    }
  };

  return (
    <div className="adduser">
      <form onSubmit={handleSearch}>
        <input
          name="username"
          style={{ backgroundColor: "white", color: "black" }}
          type="text"
          placeholder="Username"
        />
        <button type="submit">Search</button>
      </form>

      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "/images/avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd} className="add">
            Add User
          </button>
        </div>
      )}
    </div>
  );
}

export default AddUser;
