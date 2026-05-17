// CA Construcciones — API Store (datos desde Firestore vía API)
(function () {
  const API_ENDPOINTS = {
    materials: '/api/firestore-materials',
    projects: '/api/firestore-projects',
    testimonials: '/api/firestore-testimonials',
    brands: '/api/firestore-brands',
    budgets: '/api/firestore-budgets',
    clients: '/api/firestore-clients',
    admins: '/api/firestore-admins',
    site: '/api/firestore-site'
  };

  const DEFAULT_SEEDS = {
    materials: [],
    projects: [],
    testimonials: [],
    brands: [],
    budgets: [],
    clients: [],
    admins: [],
    site: { hero_kicker: '', hero_title: '', hero_sub: '', stats: [], contact: { phone: '', email: '', address: '' }, logo: null }
  };

  let loadingPromises = {};
  const listeners = {};
  const localCache = {};

  async function loadFromAPI(name) {
    if (loadingPromises[name]) return loadingPromises[name];

    loadingPromises[name] = (async () => {
      try {
        const endpoint = API_ENDPOINTS[name];
        if (!endpoint) return DEFAULT_SEEDS[name] || [];

        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            localCache[name] = data;
          } else if (data) {
            localCache[name] = { ...DEFAULT_SEEDS[name], ...data };
          } else {
            localCache[name] = DEFAULT_SEEDS[name];
          }
          notify(name);
          return localCache[name];
        }
      } catch (e) {
        console.error(`Error loading ${name}:`, e);
      }
      return DEFAULT_SEEDS[name] || [];
    })();

    return loadingPromises[name];
  }

  function load(name) {
    return localCache[name] || DEFAULT_SEEDS[name] || [];
  }

  async function saveItem(name, item) {
    try {
      const endpoint = API_ENDPOINTS[name];
      if (!endpoint) return;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        const saved = await res.json();
        const items = load(name);
        const idx = items.findIndex(i => i.id === item.id);
        if (idx >= 0) {
          items[idx] = saved;
        } else {
          items.unshift(saved);
        }
        await save(name, items);
        return saved;
      }
    } catch (e) {
      console.error(`Error saving ${name}:`, e);
    }
  }

  async function deleteItem(name, id) {
    try {
      const endpoint = API_ENDPOINTS[name];
      if (!endpoint) return;

      await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const items = load(name);
      const filtered = items.filter(i => i.id !== id);
      await save(name, filtered);
    } catch (e) {
      console.error(`Error deleting ${name}:`, e);
    }
  }

  async function save(name, data) {
    localCache[name] = data;
    notify(name);
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

  // Inicializar: cargar todos los datos desde API
  async function init() {
    console.log('🔄 Cargando datos de Firestore...');
    for (const name of Object.keys(API_ENDPOINTS)) {
      try {
        await loadFromAPI(name);
      } catch (e) {
        console.error(`Error cargando ${name}:`, e);
      }
    }
    console.log('✅ Datos cargados desde Firestore');
  }

  window.CAStore = {
    get: load,
    set: save,
    saveItem,
    deleteItem,
    on,
    uid,
    loadFromAPI,
    init
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
