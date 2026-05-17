// Configuración de Firebase para autenticación
function initializeFirebaseAuth() {
  if (!window.firebase) {
    console.error('Firebase SDK no está cargado aún');
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

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }
  const auth = window.firebase.auth();
  window.firebaseAuth = auth;
}

// Esperar a que Firebase esté disponible
if (window.firebase) {
  initializeFirebaseAuth();
} else {
  document.addEventListener('firebase-loaded', initializeFirebaseAuth);
  // Fallback: reintentar cada 100ms durante 5 segundos
  let attempts = 0;
  const checkInterval = setInterval(() => {
    if (window.firebase) {
      initializeFirebaseAuth();
      clearInterval(checkInterval);
    }
    attempts++;
    if (attempts > 50) clearInterval(checkInterval);
  }, 100);
}
