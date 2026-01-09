# 🎓 SamaTutor - Guide Complet Typst + Génération PDF

## 📋 Table des matières

1. [Installation Typst](#installation-typst)
2. [Utilisation](#utilisation)
3. [Génération PDF](#génération-pdf)
4. [Troubleshooting](#troubleshooting)
5. [Architecture](#architecture)

---

## Installation Typst

### ⚡ Installation Rapide

```bash
# Windows PowerShell (Admin)
cd samatutor1.2
install-typst.bat
```

### ✅ Vérification

```bash
typst --version
# Doit afficher: typst <version>
```

### 📥 Options d'installation alternatives

**Option 1 - Depuis GitHub:**
- Visite: https://github.com/typst/typst/releases
- Télécharge: `typst-x86_64-pc-windows-msvc.exe`
- Exécute le fichier

**Option 2 - Chocolatey:**
```bash
choco install typst
```

**Option 3 - Scoop:**
```bash
scoop install typst
```

---

## Utilisation

### 📝 Workflow Complet

```
1. Ouvre http://localhost:8000/index.html
   ↓
2. Connecte-toi (email + nom)
   ↓
3. Clique "📝 Créer un document"
   ↓
4. Remplis:
   - Titre
   - Objectifs pédagogiques
   - Matière
   - Niveau
   ↓
5. Clique "Générer avec l'IA"
   ⏳ Attends 30-60s (Ollama génère le contenu)
   ↓
6. Voir le document généré
   ↓
7. Clique "💾 Enregistrer" (optionnel)
   ↓
8. Dans "Mes documents" → Clique "📄 PDF"
   ⏳ Attends 2-5s (Typst compile)
   ↓
9. PDF téléchargé automatiquement
```

### 🎯 Buttons disponibles

| Bouton | Action |
|--------|--------|
| **Générer** | Lance l'IA pour créer le contenu |
| **Enregistrer** | Sauvegarde le document |
| **Ouvrir** | Affiche le document en détail |
| **Éditer** | Modifie le contenu |
| **Télécharger** | Télécharge en JSON |
| **📄 PDF** | Exporte en PDF avec Typst |
| **Supprimer** | Supprime le document |

---

## Génération PDF

### 🚀 Processus Automatique

```
Frontend Request
    ↓
POST /api/generate-pdf
{
  "title": "Titre du document",
  "objectives": "Objectifs...",
  "content": "Contenu généré..."
}
    ↓
Backend (Node.js)
    ├─ Crée fichier .typ
    ├─ Formate le contenu
    └─ Appelle: typst compile
    ↓
Typst CLI
    ├─ Parse le document
    ├─ Applique styles
    └─ Génère PDF
    ↓
Serveur
    ├─ Enregistre le PDF
    └─ Retourne URL
    ↓
Frontend
    └─ Télécharge le PDF
```

### 📊 Spécifications du PDF

**Format:** A4 (210×297mm)
**Marges:** 2cm (all sides)
**Police:** Libertinus Serif 11pt
**Langue:** Français
**Numérotation:** Chapitres automatiques
**Footer:** Autoématique avec date

### ⚙️ Personnalisation

Édite `server/typst-generator.js`, section `TYPST_TEMPLATE`:

```typst
#set page(
  paper: "a4",
  margin: (left: 2cm, right: 2cm, top: 2cm, bottom: 2cm),
  footer: [#align(center, [_SamaTutor_])],
)

#set text(
  font: "Libertinus Serif",  // Ou: "Source Sans Pro"
  size: 11pt,
  lang: "fr",  // Ou: "en"
)
```

---

## Troubleshooting

### ❌ "Typst n'est pas installé"

**Solution 1:**
```bash
install-typst.bat
typst --version  # Vérifier
```

**Solution 2 - Réinstallation complète:**
```bash
# Désinstaller
winget uninstall Typst.Typst

# Réinstaller
install-typst.bat
```

**Solution 3 - Manuel:**
- Télécharge: https://github.com/typst/typst/releases
- Ajoute au PATH: `C:\Program Files\Typst` (ou dossier d'installation)
- Redémarre le terminal

### ⏱️ "PDF très lent à générer"

**Normal !** Typst compile complètement le document.
- Temps: 2-5 secondes
- Premier lancement: jusqu'à 10 secondes
- Contenu long: jusqu'à 30 secondes

### ❌ "Erreur lors de la compilation Typst"

**Vérifier:**
1. Typst installé: `typst --version`
2. Dossier `/server/generated-pdfs/` existe
3. Redémarre le serveur
4. Vérifier les logs: Ouvre `server/index.js` console

**Exemple log utile:**
```
ERROR Typst: Command 'typst' not found
```

### 📁 Fichiers PDF non trouvés

```bash
# Les PDFs sont dans:
server/generated-pdfs/

# Vérifier:
ls server/generated-pdfs/
```

### 🔗 Liens de téléchargement cassés

**Vérifier:**
1. Frontend reçoit l'URL: `console.log()` in `exporterPDF()`
2. Serveur sert les fichiers: Vérifier `app.use('/download',...)`
3. Fichier existe: `ls server/generated-pdfs/`

---

## Architecture

### 📦 Fichiers Modifiés

```
samatutor1.2/
├─ server/
│  ├─ index.js                 (✏️ +endpoint /api/generate-pdf)
│  ├─ typst-generator.js      (✨ NOUVEAU - Module Typst)
│  ├─ test-typst.js           (✨ NOUVEAU - Tests)
│  ├─ install-typst.bat       (✨ NOUVEAU - Installation)
│  └─ generated-pdfs/         (📁 NOUVEAU - PDFs générés)
│
├─ js/
│  └─ app.js                   (✏️ +fonction exporterPDF())
│
├─ css/
│  └─ style.css                (✏️ +.btn-success, .btn-sm)
│
├─ index.html                  (✏️ Pas de changement requis)
│
├─ TYPST-GUIDE.md             (✨ NOUVEAU)
└─ TYPST-USAGE.md             (✨ NOUVEAU - Ce fichier)
```

### 🔄 Flux de Données

```
Frontend (HTML/JS)
    ↓
[Générer + Enregistrer]
    ↓
exporterPDF()
    ↓
fetch('/api/generate-pdf', {
  title, objectives, content
})
    ↓
Backend Node.js
    ↓
typst-generator.js::generatePdf()
    ├─ createTypstDocument()
    │   └─ Formate le contenu Markdown → Typst
    │
    ├─ compileTypst()
    │   └─ Exécute: typst compile
    │
    └─ Retourne: { pdfUrl, fileName, size }
    ↓
Frontend
    └─ Télécharge via lien <a> href={pdfUrl}
```

---

## Performance

| Opération | Temps | Notes |
|-----------|-------|-------|
| Génération IA (Ollama) | 30-60s | Dépend du modèle |
| Compilation Typst | 2-5s | Normal |
| Téléchargement | <1s | Dépend de la taille |
| **Total** | **32-65s** | Peut être plus rapide avec OpenAI |

---

## Améliorations Futures

- [ ] Prévisualisation PDF avant téléchargement
- [ ] Support des images/graphiques
- [ ] Exportation DOCX/ODT
- [ ] Themes Typst personnalisables
- [ ] Historique des PDFs générés
- [ ] Correction orthographique auto
- [ ] Mise en cache des compilations

---

## Support

**Problèmes?**

1. Consulte **TYPST-GUIDE.md** (technique)
2. Vérify les logs: `node server/test-typst.js`
3. Redémarre tout:
   ```bash
   # Terminal 1: Ollama
   ollama serve
   
   # Terminal 2: Proxy
   cd server && npm start
   
   # Terminal 3: Frontend
   python -m http.server 8000
   ```

**Ressources:**
- Typst Docs: https://typst.app/docs/
- GitHub: https://github.com/typst/typst
- Forum: https://discuss.typst.app/

---

## 🎉 Prêt à générer des PDFs!

```bash
# 1. Lance tout
ollama serve              # Terminal 1
cd server && npm start    # Terminal 2
python -m http.server 8000 # Terminal 3

# 2. Ouvre
http://localhost:8000/index.html

# 3. Génère et exporte!
```

Bon travail! 📚📄
