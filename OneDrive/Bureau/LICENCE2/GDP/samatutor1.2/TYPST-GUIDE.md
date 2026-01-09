# 📄 Intégration Typst - SamaTutor

## Installation

### 1. **Télécharger Typst**

Option A - Via le script (Windows):
```bash
install-typst.bat
```

Option B - Manuel:
- Visite https://github.com/typst/typst/releases
- Télécharge `typst-x86_64-pc-windows-msvc.exe`
- Exécute l'installeur

Option C - Via package manager:
```bash
winget install typst.typst
```

### 2. **Vérifier l'installation**

```bash
typst --version
```

Doit afficher : `typst <version>`

## Fonctionnalités

### ✅ Génération PDF Automatique

Les documents générés par l'IA sont automatiquement formatés en Typst et exportés en PDF professionnel.

**Processus:**
1. Génération du contenu via Ollama/OpenAI
2. Formatage Typst automatique
3. Compilation en PDF haute définition
4. Téléchargement au client

### 📊 Fonctionnalités Typst Intégrées

- **Mise en page professionnelle** (A4, marges, numérotation)
- **Numérotation automatique** des sections
- **Rendu mathématique** haute qualité
- **Typographie française** optimisée
- **Footer automatique** avec date de génération
- **Conversion Markdown → Typst** intelligente

## API

### Endpoint: `POST /api/generate-pdf`

**Paramètres:**
```json
{
  "title": "Titre du document",
  "objectives": "Objectifs pédagogiques (string ou array)",
  "content": "Contenu généré (HTML/Markdown)"
}
```

**Réponse (succès):**
```json
{
  "success": true,
  "pdfUrl": "/download/document-123456.pdf",
  "fileName": "document-123456.pdf",
  "size": 245632
}
```

**Réponse (erreur):**
```json
{
  "error": "Typst n'est pas installé. Exécute: install-typst.bat"
}
```

## Architecture

```
Frontend (JavaScript)
    ↓
exporterPDF() function
    ↓
POST /api/generate-pdf
    ↓
Backend (Node.js)
    ↓
typst-generator.js
    ├─ createTypstDocument()   → Crée le fichier .typ
    ├─ formatContent()         → Converti Markdown en Typst
    └─ compileTypst()          → Compile en PDF
    ↓
Typst CLI (typst compile)
    ↓
PDF générés dans ./server/generated-pdfs/
    ↓
Frontend télécharge le PDF
```

## Fichiers Modifiés

| Fichier | Changement |
|---------|-----------|
| `server/index.js` | +endpoint `/api/generate-pdf` |
| `server/typst-generator.js` | ✨ NOUVEAU - Module génération Typst |
| `js/app.js` | +fonction `exporterPDF()` |
| `index.html` | +bouton "📄 PDF" dans les cards |

## Template Typst Personnalisable

Fichier: `server/typst-generator.js`

Modifie `TYPST_TEMPLATE` pour:
- Changer les marges
- Ajouter un logo
- Modifier les couleurs
- Ajouter des sections supplémentaires

Exemple:
```typst
#set page(
  paper: "a4",
  margin: (left: 2.5cm, right: 2.5cm, top: 3cm, bottom: 3cm),
)
```

## Dépannage

### ❌ "Typst n'est pas installé"

```bash
# Installer
install-typst.bat

# Ou manuellement
winget install typst.typst

# Vérifier
typst --version
```

### ❌ "PDF non généré"

1. Vérifier Typst installé: `typst --version`
2. Vérifier dossier `/server/generated-pdfs/` existe
3. Vérifier les logs du serveur

### ⏱️ Génération lente

C'est normal ! Typst compile entièrement le document.
- Temps moyen: 2-5 secondes par page
- Premier lancement peut être plus lent

## Performance

| Opération | Temps |
|-----------|-------|
| Génération IA | 30-60s (Ollama) |
| Compilation Typst | 2-5s |
| **Total** | **32-65s** |

## Limitations Actuelles

- Pas de dessins/images dans le PDF
- Pas de formulaires interactifs
- Pas de polices personnalisées
- Contenu HTML est converté en texte simple

## Améliorations Futures

- [ ] Support des images dans les documents
- [ ] Exportation en plusieurs formats (DOCX, ODT)
- [ ] Themes Typst personnalisables par utilisateur
- [ ] Prévisualisation PDF avant téléchargement
- [ ] Histor ique des PDF générés

## Ressources

- **Documentation Typst**: https://typst.app/docs/
- **Github Typst**: https://github.com/typst/typst
- **Community**: https://discuss.typst.app/

## Support

Si Typst ne fonctionne pas:
1. Redémarre le terminal et le serveur
2. Réinstalle Typst
3. Vérifie que le chemin est dans le PATH système
4. Consulte les logs du serveur (`server/index.js`)
