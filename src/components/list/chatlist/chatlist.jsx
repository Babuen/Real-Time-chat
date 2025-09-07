import { useEffect, useState } from "react";
import "./chatlist.css";
import { useUserStore } from "../../lib/userStore";
import AddUser from "../../addUser/adduser";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";

function Chatlist() {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser?.id) return;

    const unsub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      if (res.exists()) {
        const items = res.data().chats || [];

        const chatData = await Promise.all(
          items.map(async (item) => {
            // if receiver info is already stored, no need to fetch
            if (item.receiverName && item.receiverAvatar) {
              return item;
            }

            // fallback: fetch from users collection
            if (item.receiverId) {
              const userDoc = await getDoc(doc(db, "users", item.receiverId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...item,
                  receiverName: userData.username,
                  receiverAvatar: userData.avatar,
                };
              }
            }
            return null;
          })
        );

        setChats(chatData.filter((c) => c !== null));
      } else {
        setChats([]);
      }
    });

    return () => unsub();
  }, [currentUser?.id]);

  const handleSelect = async (chat) => {
    changeChat(chat.chatId, {
      username: chat.receiverName,
      avatar: chat.receiverAvatar,
      id: chat.receiverId,
    });

    try {
      await updateDoc(doc(db, "userchats", currentUser.id), {
        chats: chats.map((c) =>
          c.chatId === chat.chatId ? { ...c, isSeen: true } : c
        ),
      });
    } catch (err) {
      console.error("Failed to update seen:", err);
    }
  };

  return (
    <div className="chatlist">
      <div className="search">
        <div className="searchBar">
          <input type="text" placeholder="Search" />
          <img
            src={addMode ? "./minus.png" : "./plus.png"}
            alt="toggle"
            onClick={() => setAddMode((prev) => !prev)}
          />
        </div>
      </div>

      {addMode ? (
        <AddUser />
      ) : (
        chats.map((chat) => (
          <div
            key={chat.chatId}
            className="item"
            onClick={() => handleSelect(chat)}
          >
            <img
              src={chat.receiverAvatar || "./profile2.png"}
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
          </div>
        ))
      )}
    </div>
  );
}

export default Chatlist;
