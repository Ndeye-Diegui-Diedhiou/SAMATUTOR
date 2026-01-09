/**
 * Module de génération de documents Typst
 * Convertit le contenu IA en PDF professionnel
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TYPST_TEMPLATE = `#set document(
  title: "%TITLE%",
  author: "SamaTutor",
  date: auto,
)

#set page(
  paper: "a4",
  margin: (left: 2cm, right: 2cm, top: 2cm, bottom: 2cm),
  footer: [#align(center, [_SamaTutor - Éducation Technique_])],
)

#set text(
  font: "Libertinus Serif",
  size: 11pt,
  lang: "fr",
)

#set heading(numbering: "1.")

#let title = [%TITLE%]
#let objectives = [%OBJECTIVES%]

#align(center, text(20pt, strong(title)))

#v(1em)

#align(center, text(12pt, emph("Généré par SamaTutor")))

#v(2em)

== Objectifs Pédagogiques

#objectives

#v(2em)

== Contenu Principal

%CONTENT%

#v(1em)

#align(center, text(9pt, "Document généré automatiquement par SamaTutor"))
`;

function createTypstDocument(title, objectives, content) {
    const typstContent = TYPST_TEMPLATE
        .replace('%TITLE%', escapeTypst(title))
        .replace('%OBJECTIVES%', formatObjectives(objectives))
        .replace('%CONTENT%', formatContent(content));
    
    return typstContent;
}

function escapeTypst(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/#/g, '\\#');
}

function formatObjectives(objectives) {
    if (!objectives) return '- Aucun objectif spécifié';
    
    if (Array.isArray(objectives)) {
        return objectives
            .map(obj => `- ${escapeTypst(obj)}`)
            .join('\n');
    }
    
    return escapeTypst(objectives)
        .split('\n')
        .filter(line => line.trim())
        .map(line => `- ${line.trim()}`)
        .join('\n');
}

function formatContent(content) {
    if (!content) return 'Aucun contenu disponible';
    
    // Convertir Markdown-like en Typst
    let typstContent = escapeTypst(content);
    
    // Titres
    typstContent = typstContent.replace(/^### (.*?)$/gm, '=== $1');
    typstContent = typstContent.replace(/^## (.*?)$/gm, '== $1');
    typstContent = typstContent.replace(/^# (.*?)$/gm, '= $1');
    
    // Gras et italique
    typstContent = typstContent.replace(/\*\*(.*?)\*\*/g, '*$1*');
    typstContent = typstContent.replace(/\*(.*?)\*/g, '_$1_');
    
    // Listes
    typstContent = typstContent.replace(/^\s*[-*+] (.*?)$/gm, '- $1');
    
    return typstContent;
}

function compileTypst(typstPath, outputPath) {
    try {
        // Chemin complet vers Typst
        const typstPath_full = 'C:\\Users\\DELL\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Typst.Typst_Microsoft.Winget.Source_8wekyb3d8bbwe\\typst-x86_64-pc-windows-msvc\\typst.exe';
        
        // Vérifier que typst est disponible
        try {
            execSync(`"${typstPath_full}" --version`, { stdio: 'pipe' });
        } catch {
            throw new Error('Typst n\'est pas installé. Exécute: install-typst.bat');
        }

        // Compiler le fichier Typst en PDF
        execSync(`"${typstPath_full}" compile "${typstPath}" "${outputPath}"`, {
            stdio: 'pipe',
            timeout: 30000
        });

        // Vérifier que le PDF a été créé
        if (!fs.existsSync(outputPath)) {
            throw new Error('PDF non généré par Typst');
        }

        return {
            success: true,
            path: outputPath,
            size: fs.statSync(outputPath).size
        };
    } catch (error) {
        console.error('Erreur Typst:', error.message);
        throw new Error(`Compilation Typst échouée: ${error.message}`);
    }
}

function generatePdf(title, objectives, content, outputDir = './generated-pdfs') {
    try {
        // Créer le répertoire s'il n'existe pas
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Générer les noms de fichiers
        const timestamp = Date.now();
        const safeTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 50);
        
        const typstPath = path.join(outputDir, `${safeTitle}-${timestamp}.typ`);
        const pdfPath = path.join(outputDir, `${safeTitle}-${timestamp}.pdf`);

        // Créer le document Typst
        const typstContent = createTypstDocument(title, objectives, content);
        fs.writeFileSync(typstPath, typstContent, 'utf-8');

        // Compiler en PDF
        const result = compileTypst(typstPath, pdfPath);

        // Nettoyer le fichier .typ (optionnel)
        try {
            fs.unlinkSync(typstPath);
        } catch (e) {
            // Ignorer les erreurs de suppression
        }

        return {
            success: true,
            pdfPath: pdfPath,
            pdfUrl: `/download/${path.basename(pdfPath)}`,
            size: result.size,
            fileName: path.basename(pdfPath)
        };
    } catch (error) {
        console.error('Erreur génération PDF:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    createTypstDocument,
    generatePdf,
    compileTypst,
    TYPST_TEMPLATE
};
