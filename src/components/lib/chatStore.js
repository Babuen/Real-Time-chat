import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser || !user) return set({ chatId: null, user: null });

    const userBlocked = user.blocked || [];
    const currentUserBlocked = currentUser.blocked || [];

    if (userBlocked.includes(currentUser.id)) {
      return set({ chatId: null, user: null, isCurrentUserBlocked: true });
    }

    if (currentUserBlocked.includes(user.id)) {
      return set({ chatId, user: null, isReceiverBlocked: true });
    }

    return set({ chatId, user, isCurrentUserBlocked: false, isReceiverBlocked: false });
  },

  resetChat: () => set({ chatId: null, user: null, isCurrentUserBlocked: false, isReceiverBlocked: false })
}));
