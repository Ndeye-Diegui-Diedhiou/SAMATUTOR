@echo off
REM Installation automatique d'Ollama sur Windows
setlocal enabledelayedexpansion

echo.
echo ========================================
echo Installation d'Ollama pour SamaTutor
echo ========================================
echo.

REM Vérifier si Ollama est déjà installé
where ollama >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama est déjà installé !
    ollama --version
    goto check_models
)

REM Télécharger Ollama
echo 📥 Téléchargement d'Ollama...
echo.
echo Veuillez:
echo 1. Visiter: https://ollama.ai/download
echo 2. Télécharger l'installeur Windows
echo 3. Exécuter l'installeur
echo 4. Revenir ici et appuyer sur Entrée
echo.
pause

REM Vérifier à nouveau
where ollama >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama est maintenant installé !
    goto launch_ollama
) else (
    echo ❌ Ollama non trouvé. Veuillez vérifier l'installation.
    goto end
)

:launch_ollama
echo.
echo 🚀 Lancement d'Ollama...
echo.
echo Note: Ollama va s'exécuter en arrière-plan sur le port 11434
echo.
start "" ollama serve

timeout /t 3

echo.
echo ⏳ Ollama démarre (30 secondes)...
timeout /t 30

:check_models
echo.
echo 📋 Vérification des modèles disponibles...
REM Pour l'instant, on va juste afficher les instructions
echo.
echo ℹ️  Modèles installés:
ollama list 2>nul || echo "   Pas de modèles trouvés"

echo.
echo 📥 Téléchargement du modèle llama3...
echo    (Cela peut prendre quelques minutes - environ 4.7 GB)
echo.
ollama pull llama3

echo.
echo ✅ Installation terminée !
echo.
echo 🧪 Pour tester:
echo    node test-ollama.js
echo.

:end
endlocal
pause
