import { useEffect, useState } from "react";
import "./chatlist.css";
import { useUserStore } from "../../lib/userStore";
import AddUser from "../../addUser/adduser";
import { useChatStore } from "../../lib/chatStore";
import { apiRequest } from "../../lib/api";

function Chatlist() {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { currentUser, token } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser?.id || !token) return;

    let isMounted = true;

    const fetchChats = async () => {
      try {
        const result = await apiRequest("/chats", { token });
        if (isMounted) {
          const sorted = [...(result.chats || [])].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          setChats(sorted);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch chats", err);
        }
      }
    };

    fetchChats();
    const intervalId = setInterval(fetchChats, 4000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [currentUser?.id, token]);

  const handleSelect = async (chat) => {
    changeChat(chat.chatId, {
      username: chat.receiverName,
      about: chat.receiverAbout || "",
      avatar: chat.receiverAvatar,
      id: chat.receiverId,
      blocked: chat.receiverBlocked || [],
    });

    try {
      await apiRequest(`/chats/${chat.chatId}/seen`, {
        method: "POST",
        token,
      });

      setChats((prev) =>
        prev.map((c) => (c.chatId === chat.chatId ? { ...c, isSeen: true, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("Failed to update seen:", err);
    }
  };

  const visibleChats = chats.filter((chat) =>
    (chat.receiverName || "").toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="chatlist">
      <div className="search">
        <div className="searchBar">
          <input
            type="text"
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <img
            src={addMode ? "/images/minus.png" : "/images/plus.png"}
            alt="toggle"
            onClick={() => setAddMode((prev) => !prev)}
          />
        </div>
      </div>

      {addMode ? (
        <AddUser onDone={() => setAddMode(false)} />
      ) : (
        visibleChats.map((chat) => (
          <div
            key={chat.chatId}
            className="item"
            onClick={() => handleSelect(chat)}
          >
            <img
              src={chat.receiverAvatar || "/images/profile2.png"}
              className="avatar"
              alt={chat.receiverName || "user"}
            />
            <div className="texts">
              <span>
                {chat.receiverName
                  ? chat.receiverName.charAt(0).toUpperCase() +
                    chat.receiverName.slice(1)
                  : "User"}
              </span>
              <p>{chat.lastMessage}</p>
            </div>
            {chat.unreadCount > 0 && (
              <div className="unreadCount">{chat.unreadCount}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Chatlist;
