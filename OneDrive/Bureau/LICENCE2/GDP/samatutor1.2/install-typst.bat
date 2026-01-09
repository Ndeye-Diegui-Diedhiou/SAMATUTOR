@echo off
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          Installation de Typst pour SamaTutor               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Vérifier si winget est disponible
where winget >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  winget non trouvé. Installation manuelle requise.
    echo.
    echo 📖 Visite : https://github.com/typst/typst/releases
    echo 📥 Télécharge : typst-x86_64-pc-windows-msvc.exe
    echo.
    exit /b 1
)

echo 📥 Installation de Typst via winget...
winget install --id typst.typst --silent

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Typst installé avec succès !
    echo.
    typst --version
    echo.
) else (
    echo.
    echo ❌ Erreur lors de l'installation
    echo 💡 Essaie l'installation manuelle :
    echo    https://github.com/typst/typst/releases
    echo.
    exit /b 1
)

echo 🎉 Installation complète !
pause
