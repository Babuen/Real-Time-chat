import { useEffect, useState, useRef } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../lib/chatStore";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useUserStore } from "../lib/userStore";

function Chat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);

  const { chatId, user } = useChatStore();
  const { currentUser } = useUserStore();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [chatId]);

  const handleEmoji = (e) => { setText((prev) => prev + e.emoji); setOpen(false); };

  const handleSend = async () => {
    if (!text.trim() || !chatId) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: currentUser.id,
      text,
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./profile2.png"} className="avatar" alt="" />
          <div className="texts">
            <span>{user?.username || "Select a chat"}</span>
            <p>{user?.about || "CEO"}</p>
          </div>
<div className="icons">
            <img src="camera.png" alt="" />
          <img src="phone.jpeg" alt="" />
          <img src="more.png" alt="" />
</div>
        </div>
      </div>

      <div className="center">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.senderId === currentUser.id ? "messageown" : "message"}>
            {msg.senderId !== currentUser.id && <img src={user?.avatar || "./avatar.png"} alt="" />}
            <div className="texts">
              <p>{msg.text}</p>
              <span>
                {msg.createdAt?.seconds
                  ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
                <img src="./emoji.png" onClick={() => setOpen((prev) => !prev)} alt="emoji" />
        {open && <EmojiPicker onEmojiClick={handleEmoji} />}
        <input type="text" value={text} placeholder="Type a message..." onChange={(e) => setText(e.target.value)} />

        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default Chat;
