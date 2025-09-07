import List from "./components/list/list";
import Details from "./components/details/details";
import Chat from "./components/chat/chat";
import Login from "./components/login/login";
import Notification from "./components/notifiction";
import { useUserStore } from "./components/lib/userStore";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./components/lib/firebase";
import { useChatStore } from "./components/lib/chatStore";

function App() {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId, user } = useChatStore(); // get selected user

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserInfo(user.uid);
      } else {
        fetchUserInfo(null);
      }
    });
    return () => unSub();
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">Loading....</div>;

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List />
          {/* Render Chat and Details only if a user is selected */}
          {chatId && user && <Chat />}
          {chatId && user && <Details />}
        </>
      ) : (
        <Login />
      )}

      <Notification />
    </div>
  );
}

export default App;
