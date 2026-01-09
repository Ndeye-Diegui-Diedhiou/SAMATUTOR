const http = require('http');

// Test quick: vérifier si serveur répond
const req = http.request('http://localhost:3001/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('✅ Serveur proxy OK:', json);
            process.exit(0);
        } catch(e) {
            console.log('Response:', data);
            process.exit(0);
        }
    });
});

req.on('error', (err) => {
    console.log('❌ Serveur proxy non accessible:', err.message);
    console.log('Assurez-vous que: cd server && npm start');
    process.exit(1);
});

req.end();
