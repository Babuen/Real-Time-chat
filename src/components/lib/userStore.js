import {doc,getDoc} from "firebase/firestore";
import {create} from 'zustand';
import {db} from "./firebase"
 export const useUserStore=create((set)=>({
    currentUser:null,
    isLoading:true,
    fetchUserInfo: async (uid) => {
  console.log("fetchUserInfo called with UID:", uid); // 👀 log this
  if (!uid) return set({ currentUser: null, isLoading: false });

  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    console.log("Firestore docSnap.exists():", docSnap.exists()); // 👀 log result
    if (docSnap.exists()) {
      set({ currentUser: { uid: docSnap.id, ...docSnap.data() }, isLoading: false });
    } else {
      set({ currentUser: null, isLoading: false });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    set({ currentUser: null, isLoading: false });
  }
}


}))
