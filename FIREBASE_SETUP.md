# Configuración de Firebase para CA Construcciones

## 1. Crear Proyecto Firebase

1. Ve a [firebase.google.com](https://firebase.google.com)
2. Haz click en "Get Started"
3. Crea un nuevo proyecto (ej: `ca-construcciones`)
4. Sigue los pasos (desactiva Google Analytics si quieres)

## 2. Habilitar Firestore

1. En la consola de Firebase, ve a **Build → Firestore Database**
2. Haz click en **Create database**
3. Selecciona **Start in test mode**
4. Elige la región más cercana (ej: `us-east1`)
5. Click en **Enable**

## 3. Crear Colecciones en Firestore

Las siguientes colecciones se crearán automáticamente cuando guardes datos:

- `materials` - Materiales del catálogo
- `projects` - Proyectos/obras
- `budgets` - Presupuestos solicitados
- `clients` - Clientes
- `testimonials` - Testimonios
- `brands` - Marcas
- `site` - Documento único con configuración del sitio

## 4. Obtener Firebase Config

1. Ve a **Project Settings** (gear icon)
2. En la pestaña **Your apps**, haz click en tu app web
3. Copia el objeto `firebaseConfig`

Debería verse así:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "...",
  appId: "1:...:web:..."
};
```

## 5. Actualizar Firebase Config en el Proyecto

### Frontend (para landing y admin)

Abre `frontend/firebase-store.js` y reemplaza:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "xxxxxxxxxx",
  appId: "1:xxxxxxxxxx:web:xxxxxxxxxxxxxxxx"
};
```

Con tu `firebaseConfig` real.

### Backend (para API routes)

1. Ve a **Project Settings → Service Accounts**
2. Haz click en **Generate New Private Key**
3. Se descargará un JSON - cópialo completo
4. En `backend/.env`, agrega:

```
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...",...}'
```

(Reemplaza todo con el contenido del JSON, en una sola línea)

## 6. Cambiar HTML para usar Firebase Store

En `frontend/index.html` y `frontend/admin.html`, reemplaza:

```html
<script src="api-store.js"></script>
```

Con:

```html
<script src="firebase-store.js"></script>
```

## 7. Instalar Dependencias

```bash
npm install
```

## 8. Listo

Ahora:
- El admin dashboard guardará datos en Firestore
- La landing cargará desde Firestore
- Todo es sincronizado automáticamente en todas las PCs

## Notas de Seguridad

**En producción**, actualiza las reglas de Firestore en **Firestore → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo lectura para públicos
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Esto permite que todos vean los datos pero solo usuarios autenticados puedan escribir.
