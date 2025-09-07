import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBlLagENT0o_PQKSlfMt1UJuf6M4mFh0zw",
  authDomain: "react-chat-4bda7.firebaseapp.com",
  projectId: "react-chat-4bda7",
  storageBucket: "react-chat-4bda7.firebasestorage.app",
  messagingSenderId: "366988409063",
  appId: "1:366988409063:web:b2267647b9439a390b8a42"
};

const app = initializeApp(firebaseConfig);

export const auth=getAuth(app)
export const db=getFirestore(app)