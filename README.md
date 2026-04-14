# SELMS — Self E-Learning Management System

A full-featured mobile-first React + Firebase e-learning app.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Firebase

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it `selms` → create
3. In the project dashboard, click the **web icon (`</>`)** to add a web app
4. Register the app and **copy the firebaseConfig object**
5. Open `src/firebase/config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 3. Enable Firebase Services

In the Firebase Console:

**Authentication:**
- Go to **Authentication → Sign-in method**
- Enable **Email/Password**

**Firestore Database:**
- Go to **Firestore Database → Create database**
- Choose **Start in test mode** (for development)
- Select a region (e.g., `us-central`)

**Deploy Security Rules (optional):**
- Copy contents of `firestore.rules` into Firestore Rules tab

### 4. Run the App
```bash
npm start
```

The app opens at `http://localhost:3000`

---

## 📱 Features

| Feature | Description |
|---|---|
| 🔐 Auth | Register/Login with email & password |
| 👤 Roles | Student and Instructor roles |
| 📚 Courses | Browse, enroll, and learn from courses |
| 🎬 Lessons | Video (YouTube), PDF, and text lessons |
| ✅ Quizzes | Timed quizzes with instant scoring |
| 📊 Progress | Track lessons completed & quiz scores |
| 💬 Messages | Real-time community chat channels |
| 👤 Profile | Edit name, bio; view stats |
| 🛠 Instructor Tools | Create courses, add lessons, build quizzes |

---

## 🗂 Project Structure

```
src/
├── firebase/
│   └── config.js          # Firebase configuration
├── context/
│   └── AuthContext.js     # Auth state & functions
├── components/
│   ├── AppShell.js        # Layout: sidebar + mobile nav
│   └── AppShell.css
├── pages/
│   ├── Login.js / Register.js
│   ├── Dashboard.js
│   ├── Courses.js / CourseDetail.js / LessonView.js
│   ├── Quizzes.js / QuizTake.js
│   ├── Progress.js
│   ├── Messages.js
│   ├── Profile.js
│   └── ManageCourse.js    # Instructor: create/edit courses & quizzes
├── App.js                 # Routes
├── index.js               # Entry point
└── index.css              # Global styles
```

---

## 🔥 Firestore Collections

```
users/{uid}                        — User profiles
courses/{courseId}                 — Course data
  └── lessons/{lessonId}           — Lesson data (sub-collection)
quizzes/{quizId}                   — Quiz data with questions
channels/{channelName}/messages/   — Community chat messages
```

---

## 🏗 Build for Production

```bash
npm run build
```

Output is in the `build/` folder — deploy to Firebase Hosting, Vercel, or Netlify.

---

## 📦 Tech Stack

- **React 18** — UI framework
- **Firebase 10** — Auth, Firestore, Storage
- **React Router v6** — Navigation
- **React Hot Toast** — Notifications
- **React Icons** — Icon library
