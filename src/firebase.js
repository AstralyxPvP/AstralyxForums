// src/firebase.js
// ── DreamLong: replace these placeholder values with your Firebase project config ──
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            'REPLACE_WITH_FIREBASE_API_KEY',
  authDomain:        'REPLACE_WITH_PROJECT.firebaseapp.com',
  projectId:         'REPLACE_WITH_PROJECT_ID',
  storageBucket:     'REPLACE_WITH_PROJECT.appspot.com',
  messagingSenderId: 'REPLACE_WITH_SENDER_ID',
  appId:             'REPLACE_WITH_APP_ID',
}

const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)
