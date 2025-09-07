import "./addUser.css";
import { useState } from "react";
import { db } from "../lib/firebase";
import { useUserStore } from "../lib/userStore";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

function AddUser() {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();

    if (!username) return;

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const foundUser = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        };
        setUser(foundUser);
      } else {
        setUser(null);
        alert("User not found");
      }
    } catch (err) {
      console.log("Search error:", err);
    }
  };

  const handleAdd = async () => {
    if (!user || !currentUser) return;

    try {
      const chatRef = doc(collection(db, "chats"));
      await setDoc(chatRef, {
        messages: [],
        createdAt: serverTimestamp(),
      });

      const userChatRef = doc(db, "userchats", user.id);
      await setDoc(
        userChatRef,
        {
          chats: arrayUnion({
            chatId: chatRef.id,
            lastMessage: "",
            receiverId: currentUser.id,
            receiverName: currentUser.username,
            receiverAvatar: currentUser.avatar || "./profile2.png",
            updatedAt: Date.now(),
          }),
        },
        { merge: true }
      );

      const currentUserChatRef = doc(db, "userchats", currentUser.id);
      await setDoc(
        currentUserChatRef,
        {
          chats: arrayUnion({
            chatId: chatRef.id,
            lastMessage: "",
            receiverId: user.id,
            receiverName: user.username,
            receiverAvatar: user.avatar || "./profile2.png",
            updatedAt: Date.now(),
          }),
        },
        { merge: true }
      );

      alert("Chat created successfully!");
      setUser(null); 
    } catch (err) {
      console.log("Error adding chat:", err);
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
            <img src={user.avatar || "./avatar.png"} alt="" />
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
