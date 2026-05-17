// CA Construcciones — Firebase Firestore Store
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBO9MOo-5rnajXXDFc7TLVEAO_wLf6j5d8",
    authDomain: "caconstrucciones-454bd.firebaseapp.com",
    projectId: "caconstrucciones-454bd",
    storageBucket: "caconstrucciones-454bd.firebasestorage.app",
    messagingSenderId: "422474273934",
    appId: "1:422474273934:web:167030583f8223cfe965df"
  };

  // Cargar Firebase SDK desde CDN
  function loadFirebaseSDK() {
    return new Promise((resolve) => {
      if (window.firebase && window.firebase.firestore) {
        resolve();
        return;
      }

      // Cargar firebase-app
      const appScript = document.createElement('script');
      appScript.src = 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
      appScript.onload = () => {
        // Cargar firebase-firestore
        const fsScript = document.createElement('script');
        fsScript.src = 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
        fsScript.onload = () => {
          // Esperar un poco para que se inicialice
          setTimeout(resolve, 500);
        };
        document.head.appendChild(fsScript);
      };
      document.head.appendChild(appScript);
    });
  }

  let app = null;
  let db = null;
  let initialized = false;

  async function initFirebase() {
    if (initialized) return;

    await loadFirebaseSDK();

    if (!window.firebase) {
      console.error('Firebase SDK no cargó correctamente');
      return;
    }

    try {
      app = window.firebase.initializeApp(firebaseConfig);
      db = window.firebase.firestore(app);
      initialized = true;
      console.log('✅ Firebase inicializado');
    } catch (e) {
      console.error('Error inicializando Firebase:', e);
    }
  }

  const collections = {
    materials: 'materials',
    projects: 'projects',
    testimonials: 'testimonials',
    brands: 'brands',
    budgets: 'budgets',
    clients: 'clients',
    site: 'site'
  };

  const DEFAULT_SEEDS = {
    materials: [],
    projects: [],
    testimonials: [],
    brands: [],
    budgets: [],
    clients: [],
    site: { hero_kicker: '', hero_title: '', hero_sub: '', stats: [], contact: { phone: '', email: '', address: '' } }
  };

  let loadingPromises = {};
  const listeners = {};
  const localCache = {};

  async function loadFromFirestore(name) {
    if (loadingPromises[name]) return loadingPromises[name];

    loadingPromises[name] = (async () => {
      try {
        await initFirebase();

        if (!db) {
          console.warn(`Firestore no disponible para ${name}`);
          return DEFAULT_SEEDS[name] || [];
        }

        const collectionName = collections[name];
        if (!collectionName) return DEFAULT_SEEDS[name] || [];

        if (name === 'site') {
          // Site es un documento único
          const doc = await db.collection(collectionName).doc('config').get();
          const data = doc.exists ? doc.data() : DEFAULT_SEEDS[name];
          localCache[name] = data;
          notify(name);
          return data;
        } else {
          // El resto son colecciones
          const snapshot = await db.collection(collectionName).get();
          const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          localCache[name] = data;
          notify(name);
          return data;
        }
      } catch (e) {
        console.error(`Error loading ${name}:`, e);
        return DEFAULT_SEEDS[name] || [];
      }
    })();

    return loadingPromises[name];
  }

  function load(name) {
    return localCache[name] || DEFAULT_SEEDS[name] || [];
  }

  async function saveItem(name, item) {
    try {
      await initFirebase();

      if (!db) {
        console.error('Firestore no disponible');
        return;
      }

      const collectionName = collections[name];
      if (!collectionName) return;

      if (name === 'site') {
        await db.collection(collectionName).doc('config').set(item, { merge: true });
      } else {
        const id = item.id;
        if (!id) {
          item.id = uid(name[0]);
        }
        await db.collection(collectionName).doc(item.id).set(item, { merge: true });
      }

      // Actualizar cache local
      await loadFromFirestore(name);
      return item;
    } catch (e) {
      console.error(`Error saving ${name}:`, e);
      throw e;
    }
  }

  async function deleteItem(name, id) {
    try {
      await initFirebase();

      if (!db) {
        console.error('Firestore no disponible');
        return;
      }

      const collectionName = collections[name];
      if (!collectionName) return;

      await db.collection(collectionName).doc(id).delete();

      // Actualizar cache local
      await loadFromFirestore(name);
    } catch (e) {
      console.error(`Error deleting ${name}:`, e);
      throw e;
    }
  }

  function on(name, fn) {
    listeners[name] = listeners[name] || [];
    listeners[name].push(fn);
    return () => {
      listeners[name] = (listeners[name] || []).filter((f) => f !== fn);
    };
  }

  function notify(name) {
    (listeners[name] || []).forEach((fn) => {
      try { fn(load(name)); } catch (e) { console.error(e); }
    });
  }

  function uid(prefix = 'id') { return prefix + '_' + Math.random().toString(36).slice(2, 9); }

  // Inicializar: cargar todos los datos desde Firestore
  async function init() {
    console.log('🔄 Inicializando Firebase Store...');
    for (const name of Object.keys(collections)) {
      try {
        await loadFromFirestore(name);
      } catch (e) {
        console.error(`Error cargando ${name}:`, e);
      }
    }
    console.log('✅ Firebase Store inicializado');
  }

  window.CAStore = {
    get: load,
    saveItem,
    deleteItem,
    on,
    uid,
    loadFromFirestore,
    init,
    initFirebase
  };

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init().catch(e => console.error('Error inicializando store:', e));
    });
  } else {
    init().catch(e => console.error('Error inicializando store:', e));
  }
})();
