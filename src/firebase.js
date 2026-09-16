import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxKKCs4upeeojNZO72q2Cp9r-P26ueyuQ",
  authDomain: "studyflow-52556.firebaseapp.com",
  projectId: "studyflow-52556",
  storageBucket: "studyflow-52556.firebasestorage.app",
  messagingSenderId: "69505685129",
  appId: "1:69505685129:web:d4877d8f59381c12d69858"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);