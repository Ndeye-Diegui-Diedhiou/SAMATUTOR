# Guide d'Installation Ollama - Windows

## ✅ Checklist Installation

### Étape 1 : Télécharger Ollama
1. Visite https://ollama.ai/download
2. Clique sur **"Download for Windows"**
3. Attends la fin du téléchargement (~150 MB)

### Étape 2 : Installer Ollama
1. Lance le fichier `OllamaSetup.exe`
2. Accepte les conditions
3. Sélectionne le dossier d'installation (défaut: `C:\Users\<username>\AppData\Local\Programs\Ollama`)
4. Attends la fin de l'installation (~2 minutes)
5. Ollama se lancera automatiquement

### Étape 3 : Vérifier l'installation
1. Ouvre PowerShell ou Command Prompt
2. Tape : `ollama --version`
3. Tu dois voir la version (ex: `ollama version 0.1.15`)

Si tu vois "commande non reconnue", ajoute Ollama au PATH :
- Redémarre ton ordinateur (l'installeur ajoute Ollama au PATH au redémarrage)
- Ou ajoute manuellement `C:\Users\<username>\AppData\Local\Programs\Ollama` au PATH système

### Étape 4 : Télécharger un modèle
Une fois Ollama installé :

```powershell
# Ouvrir une PowerShell en Admin
ollama pull llama3
```

Cela va télécharger le modèle llama3 (~4.7 GB) - cela peut prendre 10-30 minutes selon ta connexion.

### Étape 5 : Lancer Ollama
```powershell
ollama serve
```

Tu dois voir :
```
Ollama is running at http://localhost:11434
```

Garde ce terminal ouvert ! (C'est le serveur Ollama)

### Étape 6 : Tester Ollama
Dans un **autre terminal** :

```bash
# Test simple
ollama run llama3 "Bonjour, qui es-tu?"

# Ou test via notre proxy
node test-ollama.js
```

Tu dois voir une réponse du modèle llama3.

### Étape 7 : Tester avec SamaTutor
1. Ouvre http://localhost:8000/index.html
2. Connecte-toi (email + nom)
3. Sélectionne **"Ollama (llama3)"** en haut
4. Crée un document et clique **"Générer avec l'IA"**

## 🔧 Configuration pour SamaTutor

Si tu as suivi les étapes, tout fonctionne automatiquement :
- ✅ `server/.env` est configuré avec `USE_OLLAMA=true`
- ✅ Le proxy détecte automatiquement les modèles `ollama:*`
- ✅ Le frontend envoie au modèle Ollama

## ❓ Dépannage

### "ollama: commande non reconnue"
→ Redémarre l'ordinateur, puis réessaie

### Ollama s'arrête après quelques secondes
→ Vérifier les fichiers journaux :
```
C:\Users\<username>\AppData\Local\Ollama\logs
```

### La génération est très lente
→ C'est normal ! llama3 sur un PC standard prend 30-60 secondes par réponse
→ Pour plus rapide, utilise `ollama pull mistral` (plus petit/rapide)

### "Erreur: Impossible de se connecter à Ollama"
→ Assure-toi que `ollama serve` tourne
→ Vérifie que le port 11434 est libre : `netstat -ano | findstr :11434`

## 📊 Modèles Disponibles

```bash
ollama pull llama3        # Excellent (4.7 GB, ~30-60s/réponse)
ollama pull mistral       # Rapide (5.1 GB, ~15-30s/réponse)
ollama pull neural-chat   # Léger (3.8 GB, ~10-20s/réponse)
ollama pull codellama     # Code (3.6 GB, spécialisé code)
```

## ✨ Résumé des Commandes

```bash
# Vérifier l'installation
ollama --version

# Lancer le serveur (à garder actif)
ollama serve

# Télécharger un modèle
ollama pull llama3

# Lister les modèles installés
ollama list

# Tester un modèle
ollama run llama3 "ta question"

# Tester via notre proxy
node test-ollama.js
```

## 🎉 Une fois tout installé

1. Lance `ollama serve` dans un terminal
2. Lance le proxy serveur : `cd server && npm start`
3. Lance le frontend : `python -m http.server 8000`
4. Ouvre http://localhost:8000/index.html
5. Profite ! 🚀

Questions ? Consulte https://github.com/ollama/ollama ou les fichiers PRODUCTION.md et OLLAMA-TEST.md
