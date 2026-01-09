const http = require('http');

console.log('🔍 Test: Vérification Ollama...\n');

// Test 1: Vérifier si Ollama est accessible
console.log('1️⃣  Vérification Ollama sur http://localhost:11434...');
const req = http.request('http://localhost:11434/api/tags', {
    method: 'GET',
    timeout: 3000
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('   ✅ Ollama est accessible');
            console.log('   📋 Modèles disponibles:', json.models?.map(m => m.name).join(', ') || 'Aucun');
            
            // Test 2: Test génération
            testGeneration();
        } catch(e) {
            console.log('   ⚠️  Réponse:', data.substring(0, 200));
            testGeneration();
        }
    });
});

req.on('error', (err) => {
    console.log('   ❌ Ollama non accessible:', err.message);
    console.log('   ℹ️  Pour installer: https://ollama.ai/download');
    console.log('   ℹ️  Puis lancer: ollama serve');
    console.log('   ℹ️  Et télécharger un modèle: ollama pull llama3\n');
    process.exit(1);
});

req.end();

function testGeneration() {
    console.log('\n2️⃣  Test génération avec Ollama via proxy...');
    
    const postData = JSON.stringify({
        messages: [
            { role: 'user', content: 'Bonjour! Réponds en une phrase courte: qu\'est-ce que JavaScript?' }
        ],
        model: 'ollama:llama3'
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/ai',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 15000
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) {
                    console.log('   ❌ Erreur:', json.error);
                    console.log('   Details:', json.details || '');
                } else if (json.choices && json.choices[0]) {
                    console.log('   ✅ Génération réussie !');
                    console.log('   📝 Réponse Ollama:', json.choices[0].message.content);
                    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('✨ Ollama fonctionne parfaitement !');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                }
            } catch(e) {
                console.log('   ⚠️  Réponse brute:', data.substring(0, 300));
            }
        });
    });

    req.on('error', (err) => {
        console.log('   ❌ Erreur proxy:', err.message);
        console.log('   ℹ️  Assurez-vous que le serveur proxy tourne: cd server && npm start\n');
    });

    req.write(postData);
    req.end();
}
