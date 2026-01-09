# Script d'Installation Ollama pour Windows
# À exécuter en tant qu'Administrateur dans PowerShell

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 Installation Ollama pour Windows              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Ollama est déjà installé
Write-Host "🔍 Vérification de l'installation actuelle..." -ForegroundColor Yellow

$OllamaPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe"
$OllamaInPath = $null -ne (Get-Command ollama -ErrorAction SilentlyContinue)

if (Test-Path $OllamaPath) {
    Write-Host "✅ Ollama trouvé à : $OllamaPath" -ForegroundColor Green
    $ollamaVersion = & $OllamaPath --version 2>&1
    Write-Host "   Version : $ollamaVersion" -ForegroundColor Green
} elseif ($OllamaInPath) {
    Write-Host "✅ Ollama trouvé dans le PATH" -ForegroundColor Green
    ollama --version | ForEach-Object { Write-Host "   Version : $_" -ForegroundColor Green }
} else {
    Write-Host "❌ Ollama n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Téléchargement et installation d'Ollama..." -ForegroundColor Yellow
    
    # URL de téléchargement
    $downloadUrl = "https://ollama.ai/download/OllamaSetup.exe"
    $downloadPath = "$env:TEMP\OllamaSetup.exe"
    
    try {
        Write-Host "   URL : $downloadUrl" -ForegroundColor Gray
        Write-Host "   Destination : $downloadPath" -ForegroundColor Gray
        
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        (New-Object Net.WebClient).DownloadFile($downloadUrl, $downloadPath)
        
        Write-Host "✅ Téléchargement réussi" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Lancement de l'installeur..." -ForegroundColor Yellow
        Write-Host "   Suis les instructions à l'écran (Next > Install > Finish)" -ForegroundColor Cyan
        
        Start-Process -FilePath $downloadPath -Wait
        
        Write-Host ""
        Write-Host "✅ Installation terminée !" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Erreur lors du téléchargement" -ForegroundColor Red
        Write-Host "   Erreur : $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "📖 Télécharge manuellement depuis :" -ForegroundColor Yellow
        Write-Host "   https://ollama.ai/download" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host ""
Write-Host "🔄 Vérification de Ollama dans le PATH..." -ForegroundColor Yellow

if ($null -eq (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Ollama n'est pas dans le PATH" -ForegroundColor Yellow
    Write-Host "💡 Solution : Redémarre l'ordinateur" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "✅ Ollama est accessible depuis le terminal" -ForegroundColor Green
}

Write-Host ""
Write-Host "📥 Téléchargement d'un modèle..." -ForegroundColor Yellow
Write-Host "   Cela peut prendre 10-30 minutes selon ta connexion" -ForegroundColor Gray

try {
    Write-Host "   Téléchargement de llama3 (~4.7 GB)..." -ForegroundColor Cyan
    & ollama pull llama3
    Write-Host "✅ Modèle téléchargé !" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Impossible de télécharger le modèle automatiquement" -ForegroundColor Yellow
    Write-Host "   Lance manuellement : ollama pull llama3" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                   ✅ Installation Complète !                 ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1️⃣  Lance le serveur Ollama dans un terminal :" -ForegroundColor White
Write-Host "   ollama serve" -ForegroundColor Yellow
Write-Host ""
Write-Host "2️⃣  Dans un autre terminal, lance le proxy :" -ForegroundColor White
Write-Host "   cd server" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "3️⃣  Dans un 3e terminal, lance le frontend :" -ForegroundColor White
Write-Host "   python -m http.server 8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "4️⃣  Ouvre http://localhost:8000/index.html" -ForegroundColor White
Write-Host ""
Write-Host "💡 Commandes utiles :" -ForegroundColor Cyan
Write-Host "   ollama list          # Lister les modèles" -ForegroundColor Gray
Write-Host "   ollama run llama3    # Tester un modèle" -ForegroundColor Gray
Write-Host "   ollama pull mistral  # Télécharger un autre modèle" -ForegroundColor Gray
Write-Host ""
