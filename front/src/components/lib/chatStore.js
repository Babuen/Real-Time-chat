import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser || !user) {
      return set({
        chatId: null,
        user: null,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }

    const userBlocked = user.blocked || [];
    const currentUserBlocked = currentUser.blocked || [];
    const currentUserId = currentUser.id || currentUser.uid;
    const receiverId = user.id || user.uid;

    if (currentUserId && userBlocked.includes(currentUserId)) {
      return set({ chatId, user, isCurrentUserBlocked: true, isReceiverBlocked: false });
    }

    if (receiverId && currentUserBlocked.includes(receiverId)) {
      return set({ chatId, user, isCurrentUserBlocked: false, isReceiverBlocked: true });
    }

    return set({ chatId, user, isCurrentUserBlocked: false, isReceiverBlocked: false });
  },

  resetChat: () => set({ chatId: null, user: null, isCurrentUserBlocked: false, isReceiverBlocked: false })
}));
