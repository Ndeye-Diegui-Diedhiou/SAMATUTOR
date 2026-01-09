#!/usr/bin/env node

/**
 * Test de l'intégration Typst
 * Génère un PDF de test pour vérifier que tout fonctionne
 */

const { generatePdf } = require('./typst-generator');
const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║              Test Intégration Typst - SamaTutor             ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Test 1: Vérifier Typst
console.log('1️⃣  Vérification de Typst...');
try {
    const { execSync } = require('child_process');
    const typstPath = 'C:\\Users\\DELL\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Typst.Typst_Microsoft.Winget.Source_8wekyb3d8bbwe\\typst-x86_64-pc-windows-msvc\\typst.exe';
    const version = execSync(`"${typstPath}" --version`, { stdio: 'pipe' }).toString().trim();
    console.log(`✅ Typst détecté: ${version}`);
} catch (error) {
    console.log('❌ Typst non trouvé');
    console.log('   Exécute: install-typst.bat');
    process.exit(1);
}

// Test 2: Générer un PDF de test
console.log('');
console.log('2️⃣  Génération d\'un document de test...');

const testContent = `
# Introduction

SamaTutor est une plateforme pédagogique innovante combinant la génération de contenus et le tutorat intelligent.

## Section 1: Fondamentaux

- Concept 1: Base théorique solide
- Concept 2: Application pratique
- Concept 3: Évaluation continue

## Section 2: Méthodologie

L'approche maïeutique encourage l'étudiant à penser par lui-même, guidé par des questions pertinentes.

### Avantages
- Meilleure rétention
- Compréhension profonde
- Autonomie progressive

## Conclusion

Typst génère des documents d'une grande qualité typographique, parfaits pour l'éducation.
`;

const result = generatePdf(
    'Document de Test - Intégration Typst',
    ['Valider l\'installation de Typst', 'Tester la génération PDF', 'Vérifier la qualité'],
    testContent,
    path.join(__dirname, 'generated-pdfs')
);

if (result.success) {
    console.log(`✅ PDF généré avec succès !`);
    console.log(`   Fichier: ${result.fileName}`);
    console.log(`   Taille: ${(result.size / 1024).toFixed(2)} KB`);
    console.log(`   Chemin: ${result.pdfPath}`);
    console.log('');
    
    // Statistiques
    console.log('📊 Résumé');
    console.log('✅ Typst fonctionnel');
    console.log('✅ Compilation réussie');
    console.log('✅ PDF généré');
    console.log('');
    console.log('🎉 Tout est opérationnel !');
    console.log('');
    console.log('📝 Prochaine étape:');
    console.log('   1. Redémarre le serveur (npm start dans ./server)');
    console.log('   2. Ouvre http://localhost:8000/index.html');
    console.log('   3. Génère un document');
    console.log('   4. Clique sur le bouton "📄 PDF"');
    
} else {
    console.log(`❌ Erreur: ${result.error}`);
    console.log('');
    if (result.error.includes('Typst n\'est pas installé')) {
        console.log('💡 Solution: Exécute install-typst.bat');
    }
    process.exit(1);
}
