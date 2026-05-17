// Configuración de Firebase para autenticación
(function initializeFirebaseAuth() {
  if (!window.firebase) {
    setTimeout(initializeFirebaseAuth, 100);
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyAhxGbkVJ4-HjwO8SYa_8Jdq3zJZQp_Kcw",
    authDomain: "caconstrucciones-454bd.firebaseapp.com",
    projectId: "caconstrucciones-454bd",
    storageBucket: "caconstrucciones-454bd.appspot.com",
    messagingSenderId: "346873650873",
    appId: "1:346873650873:web:4e7c5b5e6f8c9d0e1f2g3h4i"
  };

  try {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
    window.firebaseAuth = window.firebase.auth();
    console.log('✓ Firebase Auth inicializado');
  } catch (e) {
    console.error('Error inicializando Firebase:', e);
  }
})();
