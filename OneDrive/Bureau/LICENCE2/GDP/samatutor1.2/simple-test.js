// Test simple avec fetch (Node 18+)
async function testSimple() {
    try {
        console.log('Envoi de la requête...');
        const response = await fetch('http://localhost:3000/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Quelle est la capitale de la France?' }
                ]
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('\n✅ Réponse de l\'IA:');
        console.log(data.choices[0].message.content);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testSimple();
