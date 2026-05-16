// CA Construcciones — API-backed data store with localStorage caching
(function () {
  const KEYS = {
    materials: 'ca_materials',
    projects: 'ca_projects',
    testimonials: 'ca_testimonials',
    brands: 'ca_brands',
    budgets: 'ca_budgets',
    clients: 'ca_clients',
  };

  const API_ENDPOINTS = {
    materials: '/api/materials',
    projects: '/api/projects',
    testimonials: '/api/testimonials',
    brands: '/api/brands',
    budgets: '/api/budgets',
    clients: '/api/clients',
  };

  let loadingPromises = {};
  const listeners = {};

  async function loadFromAPI(name) {
    if (loadingPromises[name]) return loadingPromises[name];

    loadingPromises[name] = (async () => {
      try {
        const res = await fetch(API_ENDPOINTS[name]);
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(KEYS[name], JSON.stringify(data));
          notify(name);
          return data;
        }
      } catch (e) {
        console.error(`Error loading ${name}:`, e);
      }
      return null;
    })();

    return loadingPromises[name];
  }

  const DEFAULT_SEEDS = {
    materials: [],
    projects: [],
    testimonials: [],
    brands: [],
    budgets: [],
    clients: [],
    site: { hero_kicker: '', hero_title: '', hero_sub: '', stats: [], contact: { phone: '', email: '', address: '' } }
  };

  function load(name) {
    try {
      const raw = localStorage.getItem(KEYS[name]);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_SEEDS[name] || [];
  }

  async function save(name, data) {
    localStorage.setItem(KEYS[name], JSON.stringify(data));
    notify(name);
    try { bc && bc.postMessage({ name }); } catch (e) {}
  }

  async function saveItem(name, item) {
    try {
      const res = await fetch(API_ENDPOINTS[name], {
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
      await fetch(API_ENDPOINTS[name], {
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

  let bc = null;
  try {
    bc = new BroadcastChannel('ca_store');
    bc.onmessage = (e) => notify(e.data.name);
  } catch (e) {}

  window.addEventListener('storage', (e) => {
    const name = Object.keys(KEYS).find((k) => KEYS[k] === e.key);
    if (name) notify(name);
  });

  function uid(prefix = 'id') { return prefix + '_' + Math.random().toString(36).slice(2, 9); }

  // Initialize: load all data from API on startup
  async function init() {
    for (const name of Object.keys(API_ENDPOINTS)) {
      await loadFromAPI(name);
    }
  }

  window.CAStore = {
    get: load,
    set: save,
    saveItem,
    deleteItem,
    on,
    uid,
    KEYS,
    loadFromAPI,
    init
  };

  // Auto-init on load (non-blocking)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Cargar en background sin bloquear renderizado
      init().catch(e => console.error('Error inicializando store:', e));
    });
  } else {
    // Ya cargó el DOM, iniciar en background
    init().catch(e => console.error('Error inicializando store:', e));
  }
})();
