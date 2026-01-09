// État de l'application
const appState = {
    user: null,
    documents: [],
    currentView: null,
    conversations: [],
    quizzes: [],
    aiModel: null
};

// Système de notifications toast
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '•'}</span><span>${message}</span>`;
    container.appendChild(toast);
    
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add('exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    return toast;
}

// Stockage: wrapper avec fallback vers localStorage si window.storage absent
const storage = (function() {
    if (window.storage && typeof window.storage.list === 'function') {
        return {
            list: (prefix) => window.storage.list(prefix),
            get: (key) => window.storage.get(key),
            set: (key, value) => window.storage.set(key, value),
            available: true
        };
    } else {
        return {
            list: async (prefix) => {
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith(prefix)) keys.push(k);
                }
                return { keys };
            },
            get: async (key) => {
                const val = localStorage.getItem(key);
                return val ? { value: val } : null;
            },
            set: async (key, value) => {
                localStorage.setItem(key, value);
                return true;
            },
            available: false
        };
    }
})();

// Gestion du modèle IA sélectionné
function getSavedAiModel() {
    return localStorage.getItem('samatutor_ai_model') || 'gpt-3.5-turbo';
}
function setAiModel(model) {
    appState.aiModel = model;
    localStorage.setItem('samatutor_ai_model', model);
    const selector = document.getElementById('aiModelSelector');
    if (selector) selector.value = model;
}

// Helper pour appels vers API IA avec gestion d'erreurs et parsing flexible
// TODO: Dans un environnement de production, faites transiter ces requêtes via un proxy backend
// afin de ne pas exposer les clés API côté client et de pouvoir appliquer des quotas/logging.
async function callAiApi(endpoint, payload) {
    try {
        // If calling the local proxy and a proxy key is configured on the page, attach it
        if (endpoint && endpoint.startsWith('/api/ai')) {
            payload = payload || {};
            payload.headers = payload.headers || {};
            if (window.__PROXY_KEY__) {
                payload.headers['x-proxy-key'] = window.__PROXY_KEY__;
            }
        }

        const res = await fetch(endpoint, payload);
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`API error: ${res.status} ${res.statusText} - ${txt}`);
        }
        const data = await res.json();
        // Tentatives de normalisation des différents formats de réponse
        if (data && data.content && Array.isArray(data.content) && data.content[0] && data.content[0].text) {
            return data.content[0].text;
        }
        if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content;
        }
        if (data && data.text) return data.text;
        return JSON.stringify(data);
    } catch (err) {
        throw err;
    }
}

// Initialisation
async function init() {
    // Vérifier localStorage puis sessionStorage pour la session utilisateur
    const savedUser = localStorage.getItem('samatutor_user') || sessionStorage.getItem('samatutor_user');
    if (savedUser) {
        appState.user = JSON.parse(savedUser);
        await loadUserData();
        showApp();
    } else {
        // Afficher page d'accueil par défaut
        showLandingPage();
    }
    // Charger modèle IA et binder le sélecteur
    setAiModel(getSavedAiModel());
    const selector = document.getElementById('aiModelSelector');
    if (selector) {
        selector.value = appState.aiModel;
        selector.addEventListener('change', (e) => setAiModel(e.target.value));
    }

    // Smooth scroll pour navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // Animation on scroll pour les cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card-landing, .porte-card, .pricing-card-landing').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(el);
    });
}

// Navigation page d'accueil / connexion
function showLandingPage() {
    document.getElementById('portes').classList.remove('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    const nav = document.getElementById('mainNav');
    if (nav) nav.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHomePage() {
    showLandingPage(); // Alias for compatibility
}

function showLogin(userType) {
    document.getElementById('portes').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('hidden');
    const nav = document.getElementById('mainNav');
    if (nav) nav.style.display = 'none';
    if (userType) {
        document.getElementById('userType').value = userType;
    }
}

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('nav-active');
}

// Connexion
async function login() {
    const email = document.getElementById('email').value;
    const fullName = document.getElementById('fullName').value;
    const userType = document.getElementById('userType').value;
    const rememberMe = document.getElementById('rememberMe')?.checked ?? true;

    if (!email || !fullName) {
        showToast('Veuillez remplir tous les champs', 'error');
        return;
    }

    appState.user = {
        id: Date.now().toString(),
        email,
        fullName,
        userType,
        createdAt: new Date().toISOString()
    };

    // Sauvegarder dans localStorage ou sessionStorage selon la préférence
    const storageType = rememberMe ? localStorage : sessionStorage;
    storageType.setItem('samatutor_user', JSON.stringify(appState.user));
    
    await loadUserData();
    showToast(`Bienvenue, ${fullName}!`, 'success');
    showApp();
}

// Déconnexion
function logout() {
    localStorage.removeItem('samatutor_user');
    sessionStorage.removeItem('samatutor_user');
    appState.user = null;
    appState.documents = [];
    showToast('Vous avez été déconnecté', 'info');
    showLandingPage();
}

// Charger les données utilisateur
async function loadUserData() {
    try {
        const docs = await storage.list(`docs:${appState.user.id}`);
        if (docs && docs.keys && docs.keys.length) {
            for (const key of docs.keys) {
                const result = await storage.get(key);
                if (result && result.value) {
                    try {
                        appState.documents.push(JSON.parse(result.value));
                    } catch (e) {
                        console.warn('Impossible de parser le document', key, e);
                    }
                }
            }
        }
    } catch (error) {
        console.debug('No documents or first login', error);
    }
}

// Afficher l'application
function showApp() {
    document.getElementById('portes').classList.add('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('userName').textContent = appState.user.fullName;
    const nav = document.getElementById('mainNav');
    if (nav) nav.style.display = 'none';

    if (appState.user.userType === 'enseignant') {
        showEnseignantDashboard();
    } else {
        showEtudiantDashboard();
    }

    // Attacher les listeners du menu/overlay (idempotent)
    attachSidebarListeners();
} 

// Dashboard Enseignant
function showEnseignantDashboard() {
    const sidebar = document.getElementById('sidebarNav');
    sidebar.innerHTML = `
        <li class="active" data-view="creer-document" role="button" tabindex="0" onclick="showView('creer-document', event)">📝 Créer un document</li>
        <li data-view="mes-documents" role="button" tabindex="0" onclick="showView('mes-documents', event)">📚 Mes documents</li>
        <li data-view="statistiques" role="button" tabindex="0" onclick="showView('statistiques', event)">📊 Statistiques</li>
    `;
    showView('creer-document');
}

// Dashboard Étudiant
function showEtudiantDashboard() {
    const sidebar = document.getElementById('sidebarNav');
    sidebar.innerHTML = `
        <li class="active" data-view="tuteur" role="button" tabindex="0" onclick="showView('tuteur', event)">🤖 Mon tuteur IA</li>
        <li data-view="quiz" role="button" tabindex="0" onclick="showView('quiz', event)">📝 Quiz & Exercices</li>
        <li data-view="progression" role="button" tabindex="0" onclick="showView('progression', event)">📈 Ma progression</li>
        <li data-view="documents-disponibles" role="button" tabindex="0" onclick="showView('documents-disponibles', event)">📚 Documents disponibles</li>
    `;
    showView('tuteur');
}

// Afficher une vue
function showView(viewName, evt) {
    appState.currentView = viewName;

    // Fermer la sidebar sur petits écrans pour une meilleure UX
    if (window.innerWidth <= 768) closeSidebar();

    // Mettre à jour la sidebar
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });

    // Si l'appel vient d'un événement, utilise l'élément courant, sinon cherche via data-view
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active');
    } else {
        const li = document.querySelector(`.sidebar-nav li[data-view="${viewName}"]`);
        if (li) li.classList.add('active');
    }

    const content = document.getElementById('mainContent');

    switch(viewName) {
        case 'creer-document':
            showCreerDocument(content);
            break; 
        case 'mes-documents':
            showMesDocuments(content);
            break;
        case 'statistiques':
            showStatistiques(content);
            break;
        case 'tuteur':
            showTuteur(content);
            break;
        case 'quiz':
            showQuiz(content);
            break;
        case 'progression':
            showProgression(content);
            break;
        case 'documents-disponibles':
            showDocumentsDisponibles(content);
            break;
    }

    // Placer le focus sur le titre de la section pour les lecteurs d'écran
    focusMain();
}

function focusMain() {
    const el = document.querySelector('#mainContent .section-title');
    if (el) {
        el.setAttribute('tabindex', '-1');
        el.focus();
    }
}
function showCreerDocument(content) {
    content.innerHTML = `
        <h2 class="section-title">🎨 Créer un nouveau document</h2>
        <div class="card">
            <h3>Objectifs pédagogiques</h3>
            <div class="form-group">
                <label for="docTitle">Titre du document</label>
                <input type="text" id="docTitle" placeholder="Ex: Examen OS - Algorithmes d'ordonnancement">
            </div>
            <div class="form-group">
                <label for="docType">Type de document</label>
                <select id="docType">
                    <option value="cours">Support de cours</option>
                    <option value="examen">Examen</option>
                    <option value="td">Travaux dirigés</option>
                    <option value="tp">Travaux pratiques</option>
                </select>
            </div>
            <div class="form-group">
                <label for="docMatiere">Matière</label>
                <input type="text" id="docMatiere" placeholder="Ex: Systèmes d'exploitation">
            </div>
            <div class="form-group">
                <label for="docNiveau">Niveau</label>
                <select id="docNiveau">
                    <option value="L1">Licence 1</option>
                    <option value="L2">Licence 2</option>
                    <option value="L3">Licence 3</option>
                    <option value="M1">Master 1</option>
                    <option value="M2">Master 2</option>
                </select>
            </div>
            <div class="form-group">
                <label for="docObjectifs">Objectifs d'apprentissage</label>
                <textarea id="docObjectifs" rows="4" placeholder="Ex: Évaluer la compréhension..."></textarea>
            </div>
            <div class="form-group">
                <label for="docContexte">Contexte additionnel (optionnel)</label>
                <textarea id="docContexte" rows="3" placeholder="Ex: Référence..."></textarea>
            </div>
            <button class="btn btn-primary" onclick="genererDocument()">✨ Générer avec l'IA</button>
        </div>

        <div id="generationResult" class="hidden">
            <div class="card">
                <div class="card-header">
                    <h3>📄 Document généré</h3>
                    <div>
                        <button class="btn btn-secondary" onclick="editerDocument()">✏️ Éditer</button>
                        <button class="btn btn-primary" onclick="sauvegarderDocument()">💾 Sauvegarder</button>
                    </div>
                </div>
                <div id="documentPreview" class="preview-container"></div>
            </div>
        </div>
    `;
}

// Générer un document avec l'IA
async function genererDocument() {
    const title = document.getElementById('docTitle').value;
    const type = document.getElementById('docType').value;
    const matiere = document.getElementById('docMatiere').value;
    const niveau = document.getElementById('docNiveau').value;
    const objectifs = document.getElementById('docObjectifs').value;
    const contexte = document.getElementById('docContexte').value;

    if (!title || !objectifs) {
        showToast('Veuillez remplir au moins le titre et les objectifs', 'error');
        return;
    }

    const resultDiv = document.getElementById('generationResult');
    const preview = document.getElementById('documentPreview');
    
    resultDiv.classList.remove('hidden');
    preview.innerHTML = '<div class="loading"><div class="spinner"></div><p>Génération en cours...</p></div>';

    try {
        const prompt = `Tu es un assistant pédagogique expert. Génère un ${type} pour la matière "${matiere}" niveau ${niveau}.\n\nTitre: ${title}\nObjectifs: ${objectifs}\n${contexte ? `Contexte: ${contexte}` : ''}\n\nGénère un document pédagogique complet et structuré avec:\n- Une introduction claire\n- Des exercices ou questions pertinentes\n- Des explications détaillées\n- Si pertinent, des schémas conceptuels (décris-les en texte)\n\nFormat la réponse en HTML avec des titres, paragraphes, listes, etc.`;

        // Désactiver le bouton pendant la génération
        const btn = document.querySelector('.btn.btn-primary[onclick="genererDocument()"]');
        if (btn) btn.disabled = true;

        try {
            const responseText = await callAiApi("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: appState.aiModel || "gpt-3.5-turbo",
                    max_tokens: 4000,
                    messages: [ { role: "user", content: prompt } ]
                })
            });

            const content = responseText;

            appState.currentDocument = {
                id: Date.now().toString(),
                title,
                type,
                matiere,
                niveau,
                objectifs,
                contexte,
                content,
                createdAt: new Date().toISOString(),
                userId: appState.user.id
            };

            preview.innerHTML = content;
            showToast('Document généré avec succès!', 'success', 2000);
        } finally {
            if (btn) btn.disabled = false;
        }

    } catch (error) {
        preview.innerHTML = `<p style="color: red;">Erreur lors de la génération: ${error.message}</p>`;
        showToast('Erreur lors de la génération: ' + error.message, 'error');
    }
}
// Sauvegarder un document
async function sauvegarderDocument() {
    if (!appState.currentDocument) return;

    try {
        const key = `docs:${appState.user.id}:${appState.currentDocument.id}`;
        await storage.set(key, JSON.stringify(appState.currentDocument));
        
        if (!appState.documents.find(d => d.id === appState.currentDocument.id)) {
            appState.documents.push(appState.currentDocument);
        }
        showToast('Document sauvegardé avec succès!', 'success');
        showView('mes-documents');
    } catch (error) {
        showToast('Erreur lors de la sauvegarde: ' + (error.message || error), 'error');
    }
}

// Générer PDF avec Typst
async function exporterPDF() {
    if (!appState.currentDocument) {
        showToast('Aucun document à exporter', 'error');
        return;
    }

    const btn = event?.target;
    if (btn) btn.disabled = true;
    
    try {
        showToast('⏳ Génération du PDF en cours...', 'info');

        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: appState.currentDocument.title,
                objectives: appState.currentDocument.objectives,
                content: appState.currentDocument.content
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur serveur');
        }

        const result = await response.json();
        
        if (result.success) {
            // Télécharger le PDF
            const link = document.createElement('a');
            link.href = result.pdfUrl;
            link.download = result.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('✅ PDF généré et téléchargé !', 'success');
        } else {
            throw new Error(result.error || 'Erreur inconnue');
        }
    } catch (error) {
        console.error('Erreur export PDF:', error);
        showToast('Erreur lors de la génération du PDF: ' + error.message, 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// Afficher mes documents
function showMesDocuments(content) {
    content.innerHTML = `
        <h2 class="section-title">📚 Mes documents</h2>
        <div class="document-grid" id="documentGrid"></div>
    `;

    const grid = document.getElementById('documentGrid');
    
    if (appState.documents.length === 0) {
        grid.innerHTML = '<p>Aucun document créé. Commencez par créer votre premier document !</p>';
        return;
    }

    appState.documents.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.innerHTML = `
            <h3>${doc.title}</h3>
            <p><strong>Type:</strong> ${doc.type}</p>
            <p><strong>Matière:</strong> ${doc.matiere}</p>
            <p><strong>Niveau:</strong> ${doc.niveau}</p>
            <p style="opacity: 0.8; font-size: 0.9rem;">Créé le ${new Date(doc.createdAt).toLocaleDateString()}</p>
            <div class="card-actions">
                <button class="btn btn-sm btn-primary" onclick="viewDocument(${JSON.stringify(doc).replace(/"/g, '&quot;')})">📖 Ouvrir</button>
                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editerDocument('${doc.id}')">✏️ Éditer</button>
                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); telechargerDocument('${doc.id}')">💾 Télécharger</button>
                <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); appState.currentDocument = ${JSON.stringify(doc).replace(/"/g, '&quot;')}; exporterPDF()">📄 PDF</button>
                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); supprimerDocument('${doc.id}')">🗑️ Supprimer</button>
            </div>
        `;
        // Remove card.onclick since buttons handle actions now
        // Accessibilité : rendre la carte focusable et actionnable au clavier
        card.tabIndex = 0;
        card.setAttribute('role', 'article');
        grid.appendChild(card);
    });
}

// Voir un document
function viewDocument(doc) {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <h2 class="section-title">${doc.title}</h2>
        <div class="card">
            <div class="card-header">
                <div>
                    <p><strong>Type:</strong> ${doc.type} | <strong>Matière:</strong> ${doc.matiere} | <strong>Niveau:</strong> ${doc.niveau}</p>
                </div>
                <button class="btn btn-secondary" onclick="showView('mes-documents')">← Retour</button>
            </div>
            <div class="preview-container">${doc.content}</div>
        </div>
    `;
}

// Statistiques
function showStatistiques(content) {
    content.innerHTML = `
        <h2 class="section-title">📊 Statistiques</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${appState.documents.length}</div>
                <div class="stat-label">Documents créés</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">0</div>
                <div class="stat-label">Étudiants actifs</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">0</div>
                <div class="stat-label">Quiz générés</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">100%</div>
                <div class="stat-label">Taux de satisfaction</div>
            </div>
        </div>
    `;
}

// Tuteur IA (Étudiant)
function showTuteur(content) {
    content.innerHTML = `
        <h2 class="section-title">🤖 Mon Tuteur IA</h2>
        <div class="card">
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages" role="log" aria-live="polite" aria-atomic="false">
                    <div class="message assistant">
                        Bonjour ! Je suis votre tuteur IA personnalisé. Je suis là pour vous aider à comprendre vos cours en vous guidant par le questionnement. 
                        Posez-moi des questions sur vos cours ou demandez-moi de vous expliquer un concept !
                    </div>
                </div>
                <div class="chat-input">
                    <input type="text" id="chatInput" aria-label="Message au tuteur" placeholder="Posez votre question..." onkeypress="if(event.key==='Enter') sendMessage()">
                    <button class="btn btn-primary" onclick="sendMessage()">Envoyer</button>
                </div>
            </div>
        </div>
    `;
}

// Envoyer un message au tuteur
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const chatMessages = document.getElementById('chatMessages');
    
    // Ajouter le message de l'utilisateur
    chatMessages.innerHTML += `
        <div class="message user">${message}</div>
    `;
    
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Ajouter un indicateur de chargement
    chatMessages.innerHTML += `
        <div class="message assistant" id="loadingMsg">
            <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const reply = await callAiApi("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: appState.aiModel || "gpt-3.5-turbo",
                max_tokens: 1000,
                messages: [ { role: "user", content: `Tu es un tuteur pédagogique utilisant la méthode maïeutique (questionnement socratique).\nAu lieu de donner directement les réponses, guide l'étudiant par des questions pertinentes pour l'aider à découvrir la solution par lui-même.\n\nQuestion de l'étudiant: ${message}\n\nRéponds de manière pédagogique et encourageante.` } ]
            })
        });

        document.getElementById('loadingMsg')?.remove();
        chatMessages.innerHTML += `\n            <div class="message assistant">${reply}</div>\n        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        document.getElementById('loadingMsg')?.remove();
        chatMessages.innerHTML += `\n            <div class="message assistant" style="color: red;">Erreur: ${error.message}</div>\n        `;
        showToast('Erreur du tuteur: ' + error.message, 'error');
    }
}

// Quiz (Étudiant)
function showQuiz(content) {
    content.innerHTML = `
        <h2 class="section-title">📝 Quiz & Exercices</h2>
        <div class="card">
            <h3>Générer un nouveau quiz</h3>
            <div class="form-group">
                <label for="quizSubject">Sujet du quiz</label>
                <input type="text" id="quizSubject" placeholder="Ex: Algorithmes d'ordonnancement">
            </div>
            <div class="form-group">
                <label for="quizQuestions">Nombre de questions</label>
                <input type="number" id="quizQuestions" placeholder="Ex: 5">
            </div>
            <button class="btn btn-primary" onclick="genererQuiz()">✨ Générer le quiz</button>
        </div>
        <div id="quizContainer" class="quiz-container hidden"></div>
    `;
}

// Générer un quiz
async function genererQuiz() {
    const subject = document.getElementById('quizSubject').value;
    const numQuestions = parseInt(document.getElementById('quizQuestions').value);

    if (!subject || !numQuestions) {
        showToast('Veuillez remplir tous les champs', 'error');
        return;
    }

    const quizContainer = document.getElementById('quizContainer');
    quizContainer.classList.remove('hidden');
    quizContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Génération du quiz...</p></div>';

    try {
        try {
            const responseText = await callAiApi("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: appState.aiModel || "gpt-3.5-turbo",
                    max_tokens: 2000,
                    messages: [ { role: "user", content: `Génère un quiz avec ${numQuestions} questions sur le sujet "${subject}". Format JSON avec structure: {"questions": [{"question": "...", "options": ["a", "b", "c", "d"], "correct": 0}]}` } ]
                })
            });

            let quizData;
            try {
                quizData = JSON.parse(responseText);
            } catch (e) {
                throw new Error('Réponse API invalide (JSON attendu)');
            }

            if (!quizData.questions) throw new Error('Aucune question reçue');
            displayQuiz(quizData.questions);
            showToast('Quiz généré avec succès!', 'success', 2000);
        } catch (error) {
            quizContainer.innerHTML = `<p style="color: red;">Erreur: ${error.message}</p>`;
            showToast('Erreur: ' + error.message, 'error');
        }
    } catch (error) {
        quizContainer.innerHTML = `<p style="color: red;">Erreur inattendue: ${error.message}</p>`;
        showToast('Erreur inattendue: ' + error.message, 'error');
    }
}

// Afficher le quiz
function displayQuiz(questions) {
    const quizContainer = document.getElementById('quizContainer');
    quizContainer.innerHTML = '';

    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-card';
        questionDiv.innerHTML = `
            <h4>Question ${index + 1}: ${q.question}</h4>
            <div class="options">
                ${q.options.map((option, optIndex) => `
                    <div class="option" data-question="${index}" data-option="${optIndex}" role="button" tabindex="0">${option}</div>
                `).join('')}
            </div>
        `;
        quizContainer.appendChild(questionDiv);

        // Rendre les options accessibles au clavier
        const opts = questionDiv.querySelectorAll('.option');
        opts.forEach(opt => {
            opt.addEventListener('click', () => selectOption(opt, index, parseInt(opt.dataset.option)));
            opt.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectOption(opt, index, parseInt(opt.dataset.option));
                }
            });
        });
    });
}

// Sélectionner une option
function selectOption(element, questionIndex, optionIndex) {
    const options = element.parentElement.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
}

// Progression (Étudiant)
function showProgression(content) {
    content.innerHTML = `
        <h2 class="section-title">📈 Ma progression</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">0%</div>
                <div class="stat-label">Progression globale</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">0</div>
                <div class="stat-label">Quiz complétés</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">0</div>
                <div class="stat-label">Heures d'étude</div>
            </div>
        </div>
    `;
}

// Documents disponibles (Étudiant)
function showDocumentsDisponibles(content) {
    content.innerHTML = `
        <h2 class="section-title">📚 Documents disponibles</h2>
        <div class="document-grid" id="availableDocsGrid"></div>
    `;

    const grid = document.getElementById('availableDocsGrid');
    if (appState.documents.length === 0) {
        grid.innerHTML = '<p>Aucun document disponible pour le moment.</p>';
        return;
    }

    appState.documents.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.innerHTML = `
            <h3>${doc.title}</h3>
            <p><strong>Matière:</strong> ${doc.matiere}</p>
            <p><strong>Niveau:</strong> ${doc.niveau}</p>
        `;
        card.onclick = () => viewDocument(doc);
        // Accessibilité : rendre la carte focusable et actionnable au clavier
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                viewDocument(doc);
            }
        });
        grid.appendChild(card);
    });
}

// Éditer un document
let currentEditDocId = null;

function editerDocument(docId) {
    const doc = appState.documents.find(d => d.id === docId);
    if (!doc) {
        showToast('Document introuvable', 'error');
        return;
    }

    currentEditDocId = docId;
    document.getElementById('editContent').value = doc.content || '';
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editContent').focus();
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    currentEditDocId = null;
}

async function saveEditedDocument() {
    if (!currentEditDocId) return;

    const doc = appState.documents.find(d => d.id === currentEditDocId);
    if (!doc) {
        showToast('Document introuvable', 'error');
        return;
    }

    const newContent = document.getElementById('editContent').value;
    doc.content = newContent;

    try {
        const key = `docs:${appState.user.id}:${doc.id}`;
        await storage.set(key, JSON.stringify(doc));
        showToast('Document mis à jour avec succès', 'success');
        closeEditModal();
        // Rafraîchir la vue si on est sur "mes documents"
        if (appState.currentView === 'mes-documents') showView('mes-documents');
    } catch (error) {
        showToast('Erreur lors de la mise à jour: ' + (error.message || error), 'error');
    }
}

// Supprimer un document
let currentDeleteDocId = null;

function supprimerDocument(docId) {
    const doc = appState.documents.find(d => d.id === docId);
    if (!doc) {
        showToast('Document introuvable', 'error');
        return;
    }

    currentDeleteDocId = docId;
    document.getElementById('confirmModal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    currentDeleteDocId = null;
}

async function confirmDelete() {
    if (!currentDeleteDocId) return;

    try {
        const key = `docs:${appState.user.id}:${currentDeleteDocId}`;
        // Remove from storage
        if (storage.available) {
            // Use direct localStorage removal if window.storage doesn't have delete method
            localStorage.removeItem(key);
        }
        
        // Remove from appState
        appState.documents = appState.documents.filter(d => d.id !== currentDeleteDocId);
        
        showToast('Document supprimé avec succès', 'success');
        closeConfirmModal();
        // Rafraîchir la vue si on est sur "mes documents"
        if (appState.currentView === 'mes-documents') showView('mes-documents');
    } catch (error) {
        showToast('Erreur lors de la suppression: ' + (error.message || error), 'error');
    }
}

// Télécharger un document
function telechargerDocument(docId) {
    const doc = appState.documents.find(d => d.id === docId);
    if (!doc) return alert('Document introuvable');

    const blob = new Blob([doc.content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title || 'document'}.html`;
    a.click();
    URL.revokeObjectURL(url);
}


// Sidebar mobile: open/close helpers
function attachSidebarListeners() {
    const burger = document.getElementById('burgerBtn');
    const overlay = document.getElementById('sidebarOverlay');
    if (burger && !burger.dataset.attached) {
        burger.addEventListener('click', toggleSidebar);
        burger.dataset.attached = '1';
    }
    if (overlay && !overlay.dataset.attached) {
        overlay.addEventListener('click', closeSidebar);
        overlay.dataset.attached = '1';
    }

    // Keyboard access to the sidebar items (Enter / Space)
    const sidebarNav = document.getElementById('sidebarNav');
    if (sidebarNav && !sidebarNav.dataset.kbd) {
        sidebarNav.addEventListener('keydown', (e) => {
            const li = e.target;
            if ((e.key === 'Enter' || e.key === ' ') && li && li.matches('li[role="button"]')) {
                e.preventDefault();
                li.click();
            }
        });
        sidebarNav.dataset.kbd = '1';
    }
}

function toggleSidebar() {
    const isOpen = document.body.classList.toggle('sidebar-open');
    document.getElementById('burgerBtn')?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const overlay = document.getElementById('sidebarOverlay');
    if (!overlay) return;
    if (isOpen) {
        overlay.classList.remove('hidden');
        overlay.classList.add('visible');
        overlay.setAttribute('aria-hidden', 'false');
    } else {
        overlay.classList.add('hidden');
        overlay.classList.remove('visible');
        overlay.setAttribute('aria-hidden', 'true');
    }
}

function closeSidebar() {
    if (document.body.classList.contains('sidebar-open')) {
        document.body.classList.remove('sidebar-open');
        document.getElementById('burgerBtn')?.setAttribute('aria-expanded', 'false');
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('visible');
            overlay.setAttribute('aria-hidden', 'true');
        }
    }
}

// Initialiser l'app au chargement
window.addEventListener('load', init);
