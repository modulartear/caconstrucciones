// Configuración de Firebase para autenticación
const firebaseConfig = {
  apiKey: "AIzaSyAhxGbkVJ4-HjwO8SYa_8Jdq3zJZQp_Kcw",
  authDomain: "caconstrucciones-454bd.firebaseapp.com",
  projectId: "caconstrucciones-454bd",
  storageBucket: "caconstrucciones-454bd.appspot.com",
  messagingSenderId: "346873650873",
  appId: "1:346873650873:web:4e7c5b5e6f8c9d0e1f2g3h4i"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Almacenar la instancia de autenticación globalmente
window.firebaseAuth = auth;
