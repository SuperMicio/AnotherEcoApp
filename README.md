[README.md](https://github.com/user-attachments/files/28405609/README.md)
# AnotherEcoApp

Piattaforma web collaborativa per la segnalazione e il monitoraggio di problemi ambientali urbani. Gli utenti possono inviare segnalazioni, commentarle e votarle. Gli amministratori le validano e gestiscono la community. Un modulo AI analizza automaticamente ogni segnalazione valutandone gravità e autenticità.

Sviluppata con stack **MEVN** (MongoDB, Express, Vue.js, Node.js) con comunicazione real-time tramite **Socket.io**.

---

## Requisiti

- [Node.js](https://nodejs.org) v18 o superiore
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (per MongoDB)
- Una chiave API gratuita di [Groq](https://console.groq.com)

---

## Avvio

### 1. Clona la repository

```bash
git clone https://github.com/SuperMicio/AnotherEcoApp.git
cd AnotherEcoApp
```

### 2. Configura le variabili d'ambiente

Crea il file `backend/.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/climatechange
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Avvia il database (Docker)

```bash
cd backend
docker-compose up -d
```

### 4. Avvia il backend

```bash
cd backend
npm install
node src/index.js
```

### 5. Avvia il frontend

```bash
cd frontend
npm install
npm run serve
```

L'applicazione sarà disponibile su **http://localhost:8080**

---

## Credenziali di default

Non esistono credenziali preimpostate. Al primo avvio registra un account dalla pagina `/register` scegliendo il ruolo **Admin** per accedere al pannello di amministrazione.

---

## Tecnologie

| Layer | Tecnologia |
|---|---|
| Frontend | Vue.js 3, Vuex, Vue Router, Axios, Socket.io-client, Leaflet, SASS |
| Backend | Node.js, Express, Socket.io, JWT, bcryptjs |
| Database | MongoDB (Docker), Mongoose |
| AI | Groq API (LLaMA 3.3 70B) |
