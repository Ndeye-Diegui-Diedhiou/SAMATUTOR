// Script de test pour l'API d'IA
const http = require('http');

async function testAI(question) {
    const data = JSON.stringify({
        messages: [{ role: 'user', content: question }]
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/ai',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                console.log('Réponse brute du serveur:', responseData);
                console.log('Status code:', res.statusCode);
                try {
                    const parsed = JSON.parse(responseData);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}. Data: ${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Tests
async function runTests() {
    console.log('🧪 Test 1: Question simple sur JavaScript...\n');
    try {
        const response1 = await testAI("Bonjour, peux-tu m'expliquer brièvement ce qu'est JavaScript?");
        console.log('✅ Réponse reçue:');
        console.log(response1.choices[0].message.content);
        console.log('\n' + '='.repeat(80) + '\n');
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }

    console.log('🧪 Test 2: Question mathématique...\n');
    try {
        const response2 = await testAI("Quelle est la racine carrée de 144?");
        console.log('✅ Réponse reçue:');
        console.log(response2.choices[0].message.content);
        console.log('\n' + '='.repeat(80) + '\n');
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }

    console.log('🧪 Test 3: Question de programmation...\n');
    try {
        const response3 = await testAI("Comment créer une fonction en Python?");
        console.log('✅ Réponse reçue:');
        console.log(response3.choices[0].message.content);
        console.log('\n' + '='.repeat(80) + '\n');
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }

    console.log('✨ Tests terminés!');
}

runTests();
