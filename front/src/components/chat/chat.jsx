import { useEffect, useState, useRef } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from "../lib/userStore";
import { apiRequest } from "../lib/api";
import { toast } from "react-toastify";

function Chat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);

  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const { currentUser, token } = useUserStore();
  const currentUserId = currentUser?.id || currentUser?.uid;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!chatId || !token) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const result = await apiRequest(`/chats/${chatId}/messages`, { token });
        if (isMounted) {
          setMessages(result.messages || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch messages", err);
        }
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [chatId, token]);

  const handleEmoji = (e) => { setText((prev) => prev + e.emoji); setOpen(false); };

  const handleSend = async () => {
    if (!text.trim() || !chatId) return;
    if (isCurrentUserBlocked || isReceiverBlocked) return;

    const senderId = currentUser?.id || currentUser?.uid;
    const receiverId = user?.id || user?.uid;
    const messageText = text.trim();

    if (!senderId || !receiverId) return;

    try {
      await apiRequest(`/chats/${chatId}/messages/create`, {
        method: "POST",
        token,
        body: { text: messageText },
      });

      const result = await apiRequest(`/chats/${chatId}/messages`, { token });
      setMessages(result.messages || []);
      setText("");
    } catch (err) {
      toast.error(err?.message || "Failed to send message");
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "/images/profile2.png"} className="avatar" alt="" />
          <div className="texts">
            <span>{user?.username || "Select a chat"}</span>
            <p>{user?.about || "CEO"}</p>
          </div>
<div className="icons">
            <img src="/images/camera.png" alt="" />
          <img src="/images/phone.jpeg" alt="" />
          <img src="/images/more.png" alt="" />
</div>
        </div>
      </div>

      <div className="center">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.senderId === currentUserId ? "messageown" : "message"}>
            {msg.senderId !== currentUserId && <img src={user?.avatar || "/images/avatar.png"} alt="" />}
            <div className="texts">
              <p>{msg.text}</p>
              <span>
                {msg.created_at
                  ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </span>
            </div>
          </div>
        ))}
        {(isCurrentUserBlocked || isReceiverBlocked) && (
          <div className="message">
            <div className="texts">
              <p>
                {isCurrentUserBlocked
                  ? "You cannot send messages because this user has blocked you."
                  : "You blocked this user. Unblock them from details to send messages."}
              </p>
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <img src="/images/emoji.png" onClick={() => setOpen((prev) => !prev)} alt="emoji" />
        {open && <EmojiPicker onEmojiClick={handleEmoji} />}
        <input type="text" value={text} placeholder="Type a message..." onChange={(e) => setText(e.target.value)} />

        <button onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
