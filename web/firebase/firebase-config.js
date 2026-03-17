const firebaseConfig = {
  apiKey: "AIzaSyA8ujdjUdlqXKgfvMziejlndXTrJWxKMYc",
  authDomain: "comen-b09b2.firebaseapp.com",
  projectId: "comen-b09b2",
  storageBucket: "comen-b09b2.firebasestorage.app",
  messagingSenderId: "1014618125792",
  appId: "1:1014618125792:web:85ebdbba8e5ffcdac36785",
  measurementId: "G-RNSRYB6EHZ"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();