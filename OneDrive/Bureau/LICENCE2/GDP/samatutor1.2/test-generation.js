#!/usr/bin/env node
/**
 * Test local: Vérifier si la génération de documents est opérationnelle
 * Lance: node test-generation.js
 */

const http = require('http');

async function testGeneration() {
    console.log('\n🧪 Test local: Génération de documents\n');
    
    // Test 1: Vérifier le serveur proxy
    console.log('1️⃣  Vérification du serveur proxy (port 3001)...');
    try {
        const healthResponse = await makeRequest('http://localhost:3001/health', {
            method: 'GET'
        });
        const health = JSON.parse(healthResponse);
        if (health.ok) {
            console.log('   ✅ Serveur proxy est opérationnel');
        }
    } catch (err) {
        console.error('   ❌ Erreur serveur proxy:', err.message);
        console.error('   Assurez-vous que npm start est lancé dans le dossier server/');
        process.exit(1);
    }

    // Test 2: Test appel API (sans OpenAI API key réelle, on teste juste le endpoint)
    console.log('\n2️⃣  Test endpoint /api/ai...');
    try {
        const testPayload = {
            messages: [
                { role: 'user', content: 'Test: Génère un court résumé pédagogique sur JavaScript' }
            ],
            model: 'gpt-3.5-turbo'
        };

        const response = await makeRequest('http://localhost:3001/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        const result = JSON.parse(response);
        
        // Si la clé API est invalide, on recevra une erreur d'authentification
        if (result.error) {
            if (result.error.includes('Unauthorized') || result.error.includes('invalid_api_key')) {
                console.log('   ⚠️  Erreur attendue: Clé API OpenAI invalide/manquante');
                console.log('   ℹ️  Configure un vrai OPENAI_API_KEY dans server/.env pour tester la génération réelle');
                console.log('   ℹ️  Pour le mode démo, utilise USE_OLLAMA=true si Ollama est installé\n');
                process.exit(0);
            } else {
                console.log('   ❌ Erreur:', result.error, result.details || '');
                process.exit(1);
            }
        }

        if (result.choices && result.choices[0] && result.choices[0].message) {
            console.log('   ✅ API répond correctement');
            console.log('   📝 Réponse:', result.choices[0].message.content.substring(0, 100) + '...\n');
        }

    } catch (err) {
        console.error('   ❌ Erreur:', err.message, '\n');
        process.exit(1);
    }

    // Test 3: Vérification du frontend
    console.log('3️⃣  Vérification du frontend (http://localhost:8000)...');
    try {
        const htmlResponse = await makeRequest('http://localhost:8000/index.html', {
            method: 'GET'
        });
        if (htmlResponse.includes('<html') && htmlResponse.includes('SamaTutor')) {
            console.log('   ✅ Frontend est servi correctement\n');
        }
    } catch (err) {
        console.error('   ❌ Frontend non accessible:', err.message);
        console.error('   Assurez-vous que python -m http.server 8000 est lancé dans le dossier samatutor1.2/\n');
        process.exit(1);
    }

    // Résumé
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Infrastructure locale opérationnelle !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Prochaines étapes:');
    console.log('  1. Ouvrir http://localhost:8000/index.html');
    console.log('  2. Se connecter (email + nom)');
    console.log('  3. Naviguer vers "Créer un document"');
    console.log('  4. Cliquer "Générer avec l\'IA"');
    console.log('\n🔑 Note: Pour générer du contenu réel, configure OPENAI_API_KEY dans server/.env\n');
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? require('https') : http;
        const requestOptions = {
            ...new URL(url),
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 5000
        };

        const req = protocol.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

testGeneration().catch(err => {
    console.error('Test échoué:', err);
    process.exit(1);
});
