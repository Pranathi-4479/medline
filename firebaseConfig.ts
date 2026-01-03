import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCBmYVim_CHp7U7aJvwFTkZCGj1xIVLlAU",
  authDomain: "medlink-27.firebaseapp.com",
  projectId: "medlink-27",
  storageBucket: "medlink-27.firebasestorage.app",
  messagingSenderId: "489194125452",
  appId: "1:489194125452:web:19a3c6632c76f62b9fe3a9",
  measurementId: "G-2E8HK85EDY"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);