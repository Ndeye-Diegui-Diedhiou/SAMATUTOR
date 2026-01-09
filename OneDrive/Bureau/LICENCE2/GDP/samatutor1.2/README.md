# 🎓 SamaTutor

**Plateforme éducative complète combinant création de documents pédagogiques et tutorat IA personnalisé.**

---

## 📖 À propos

SamaTutor offre deux espaces distincts :

### 🎓 **L'Atelier** — Pour les enseignants
- Génération de documents pédagogiques (cours, examens, TD/TP) avec l'IA
- Édition, suppression et téléchargement de documents
- Organisation par objectifs pédagogiques
- Interface intuitive et moderne

### 📚 **Le Tuteur** — Pour les étudiants
- Tutorat interactif basé sur les documents du professeur
- Quiz adaptatifs et exercices dynamiques
- Feedback immédiat et suivi de progression
- Disponibilité 24h/24, 7j/7

---

## ✨ Fonctionnalités

- ✅ Génération de contenu pédagogique par IA (Anthropic Claude, OpenAI, Ollama)
- ✅ Édition, suppression et téléchargement de documents
- ✅ Système de stockage local (localStorage + compatibilité window.storage)
- ✅ Interface responsive avec menu burger mobile
- ✅ Accessibilité (ARIA, navigation clavier, focus management)
- ✅ Proxy backend sécurisé pour les appels IA
- ✅ Tests unitaires (serveur proxy)
- ⏳ Authentification utilisateur (en développement)
- ⏳ Éditeur WYSIWYG avancé (en développement)

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** v18+ et **npm**
- Une clé API **Anthropic** (ou OpenAI/Ollama selon votre choix)

### Installation

1. **Cloner le projet**

   ```bash
   git clone <URL_DU_REPO>
   cd samatutor1.2
   ```

2. **Installer les dépendances du frontend**

   ```bash
   npm install
   ```

3. **Installer les dépendances du serveur proxy**

   ```bash
   cd server
   npm install
   ```

4. **Configurer les variables d'environnement**

   Copiez `.env.example` vers `.env` dans le dossier `server/` :

   ```bash
   cp server/.env.example server/.env
   ```

   Éditez `server/.env` et ajoutez votre clé API :

   ```env
   PORT=3001
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   CORS_ORIGIN=*
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX=30
   # Optionnel : clé proxy pour restreindre l'accès
   PROXY_KEY=your_dev_proxy_key_here
   ```

---

## 🏃 Lancer l'application

### 1. Démarrer le proxy backend

Dans un terminal :

```bash
cd server
npm start
```

Le proxy démarre sur `http://localhost:3001` (ou le PORT configuré).

### 2. Ouvrir l'app frontend

Ouvrez simplement `index.html` dans votre navigateur ou utilisez un serveur web local (ex: Live Server dans VS Code).

Le frontend enverra les requêtes IA vers `/api/ai` (proxy local).

---

## 🧪 Tests

### Tests rapides (lint + smoke)

```bash
npm test
```

### Tests complets (lint + smoke + audit a11y)

```bash
npm run test:all
```

### Tests du proxy

```bash
cd server
npm test
```

### Audit accessibilité seul

```bash
npm run a11y
```

Résultats dans `tools/a11y-report.json`.

### Smoke tests (headless) seuls

```bash
npm run smoke
```

---

## 🛠️ Structure du projet

```
samatutor1.2/
├── index.html              # Point d'entrée de l'app
├── css/
│   └── style.css           # Styles principaux
├── js/
│   └── app.js              # Logique frontend (storage, views, IA)
├── server/
│   ├── index.js            # Proxy Express pour appels IA
│   ├── package.json
│   ├── .env.example        # Template de variables d'env
│   ├── README.md
│   └── test/
│       └── proxy.test.js   # Tests unitaires du proxy
├── tools/
│   ├── a11y-scan.js        # Script d'audit axe-core
│   └── smoke-test.js       # Tests fonctionnels headless (JSDOM)
├── package.json            # Dépendances frontend (axe, jsdom)
└── README.md               # Ce fichier
```

---

## 🔐 Sécurité

- **NE PAS** exposer vos clés API dans le code frontend.
- Le proxy backend (`server/`) doit être le seul à appeler les API externes.
- En production, configurez un **CORS** strict et ajoutez une authentification (sessions, JWT) au proxy.
- Si vous utilisez `PROXY_KEY`, ne l'exposez jamais publiquement (serveur uniquement).

---

## 📚 Documentation technique

### Endpoints du proxy

- **POST /api/ai**  
  Forwarde les requêtes vers Anthropic (ou autre fournisseur).  
  Nécessite un header `x-proxy-key` si `PROXY_KEY` est défini dans `.env`.

- **GET /health**  
  Vérification de santé du serveur.

### Stockage

Le frontend utilise un wrapper de storage qui :
- Tente d'utiliser `window.storage` (si disponible)
- Sinon, utilise `localStorage` en fallback

### Intégration IA

Les appels IA passent par la fonction `callAiApi(endpoint, payload)` dans `js/app.js`. Le frontend appelle `/api/ai` (proxy local), qui transmet à l'API externe avec les bonnes clés.

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalité`)
3. Committez vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pushez (`git push origin feature/ma-fonctionnalité`)
5. Ouvrez une Pull Request

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 📧 Contact & Support

Pour toute question ou suggestion :
- Ouvrez une issue sur GitHub
- Contactez l'équipe via [votre_email@example.com]

---

## 🔧 Développement

### Scripts disponibles

```bash
npm run a11y       # Audit d'accessibilité (axe-core)
npm run smoke      # Tests fonctionnels headless
cd server && npm test  # Tests unitaires du proxy
```

### Configuration recommandée

- **VS Code** avec les extensions :
  - ESLint
  - Prettier
  - Live Server
- **Node.js** v18+ (LTS recommandé)

---

## 🚀 Déploiement en production

### Option 1 : Déploiement statique (Vercel/Netlify) + Backend externe

Pour un déploiement simple du frontend statique :

1. **Vercel** (recommandé)
   ```bash
   npm install -g vercel
   vercel
   ```
   Configurez `NEXT_PUBLIC_API_URL=https://votre-backend.com` via les variables d'environnement Vercel.

2. **Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir .
   ```
   Configurez un redirect pour `/api/ai` vers votre backend dans `netlify.toml`.

### Option 2 : Déploiement full-stack avec Docker

Déployez le proxy + frontend sur une plateforme comme Railway, Fly.io, ou DigitalOcean App Platform.

```bash
docker-compose up -d
```

**Variables d'environnement pour production :**
```env
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=sk-...
CORS_ORIGIN=https://votre-domaine.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
PROXY_KEY=your_secure_key_here
```

### Option 3 : Railway.app (recommandé pour débuter)

1. Push votre code sur GitHub
2. Connectez votre repo sur railway.app
3. Railway détecte le Dockerfile et déploie automatiquement
4. Ajouter les variables d'env dans Settings → Variables

### Option 4 : Fly.io

```bash
flyctl launch
# Suivez les prompts et déployez
flyctl secrets set OPENAI_API_KEY=sk-...
```

### Optimisations de production

- Activez **Helmet.js** dans `server/index.js` (décommentez `app.use(helmet())`)
- Restreignez `CORS_ORIGIN` à votre domaine
- Utilisez un **content delivery network (CDN)** pour les assets statiques (Cloudflare, AWS CloudFront)
- Minifiez le CSS/JS avec **terser** ou **cssnano** (optionnel)
- Activez la compression **gzip** dans le middleware Express
- Versionnez vos secrets avec un gestionnaire comme **1Password**, **Vault**, ou les secrets du CI/CD

---

## 🌟 Roadmap

- [x] Proxy backend sécurisé
- [x] Édition/suppression/téléchargement de documents
- [x] Modales de confirmation
- [x] Audit a11y automatisé
- [ ] Authentification utilisateur (sessions/JWT)
- [ ] Base de données (MongoDB/PostgreSQL)
- [ ] Éditeur WYSIWYG avancé (TinyMCE/Quill)
- [ ] CI/CD (GitHub Actions)
- [ ] Déploiement (Vercel/Netlify + backend sur Railway/Fly.io)
- [ ] PWA (mode hors-ligne)

---

Fait avec ❤️ pour l'éducation.