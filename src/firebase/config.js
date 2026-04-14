import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyCLTaYO5rf25TS0njS9ozu6Q3wucpHhxl4",
  authDomain: "selms-d6292.firebaseapp.com",
  projectId: "selms-d6292",
  storageBucket: "selms-d6292.firebasestorage.app",
  messagingSenderId: "204430116372",
  appId: "1:204430116372:web:fa71cdfcb434474cdf0901"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
