#!/usr/bin/env node

/**
 * Script de test complet de SamaTutor + Ollama
 * Vérifie que tout est opérationnel avant d'utiliser l'app
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
};

async function testConnection(host, port, name) {
    return new Promise((resolve) => {
        const req = http.request(
            { hostname: host, port, path: '/', method: 'GET', timeout: 5000 },
            (res) => {
                log.success(`${name} accessible (port ${port})`);
                res.on('data', () => {}); // Drain response
                res.on('end', () => resolve(true));
            }
        );

        req.on('error', () => {
            log.error(`${name} non accessible (port ${port})`);
            resolve(false);
        });

        req.on('timeout', () => {
            log.error(`${name} timeout (port ${port})`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

async function testOllama() {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            model: 'llama3',
            prompt: 'Qui es-tu?',
            stream: false,
        });

        const req = http.request(
            {
                hostname: 'localhost',
                port: 11434,
                path: '/api/generate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length,
                },
                timeout: 30000,
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.response) {
                            log.success(`Ollama génère du contenu (${response.response.length} chars)`);
                            resolve(true);
                        } else {
                            log.error('Ollama : réponse invalide');
                            resolve(false);
                        }
                    } catch (e) {
                        log.error('Ollama : erreur de parsing');
                        resolve(false);
                    }
                });
            }
        );

        req.on('error', (e) => {
            log.error(`Ollama : ${e.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            log.error('Ollama : timeout (30s)');
            req.destroy();
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

async function testProxyGeneration() {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            model: 'ollama:llama3',
            prompt: 'Qui es-tu?',
        });

        const req = http.request(
            {
                hostname: 'localhost',
                port: 3001,
                path: '/api/ai',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length,
                },
                timeout: 30000,
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.response) {
                            log.success(`Proxy génère du contenu (${response.response.length} chars)`);
                            resolve(true);
                        } else if (response.error) {
                            log.error(`Proxy : ${response.error}`);
                            resolve(false);
                        } else {
                            log.error('Proxy : réponse invalide');
                            resolve(false);
                        }
                    } catch (e) {
                        log.error(`Proxy : ${e.message}`);
                        resolve(false);
                    }
                });
            }
        );

        req.on('error', (e) => {
            log.error(`Proxy : ${e.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            log.error('Proxy : timeout (30s)');
            req.destroy();
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

function checkEnvFile() {
    const envPath = path.join(__dirname, 'server', '.env');
    if (!fs.existsSync(envPath)) {
        log.warning('Fichier .env non trouvé (n\'est pas critique)');
        return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('USE_OLLAMA=true')) {
        log.success('Configuration .env activée pour Ollama');
        return true;
    } else {
        log.warning('USE_OLLAMA=false dans .env (utilise OpenAI)');
        return false;
    }
}

async function main() {
    console.clear();
    log.title('🧪 Test complet SamaTutor + Ollama');

    log.info('Vérification des services...\n');

    // 1. Vérifier Frontend
    log.info('1️⃣  Frontend (http://localhost:8000)');
    const frontendOk = await testConnection('localhost', 8000, 'Frontend');
    console.log();

    // 2. Vérifier Proxy
    log.info('2️⃣  Proxy (http://localhost:3001)');
    const proxyOk = await testConnection('localhost', 3001, 'Proxy');
    console.log();

    // 3. Vérifier Ollama
    log.info('3️⃣  Ollama (http://localhost:11434)');
    const ollamaOk = await testConnection('localhost', 11434, 'Ollama');
    console.log();

    // 4. Vérifier .env
    log.info('4️⃣  Configuration');
    checkEnvFile();
    console.log();

    // 5. Test génération si tout est accessible
    if (frontendOk && proxyOk && ollamaOk) {
        log.title('🚀 Test de génération complète');

        log.info('Génération Ollama...');
        const ollamaGen = await testOllama();
        console.log();

        if (ollamaGen) {
            log.info('Génération via Proxy...');
            const proxyGen = await testProxyGeneration();
            console.log();
        }
    }

    // 6. Résumé
    log.title('📊 Résumé');

    const status = [
        { name: '✓ Frontend', ok: frontendOk },
        { name: '✓ Proxy', ok: proxyOk },
        { name: '✓ Ollama', ok: ollamaOk },
    ];

    status.forEach(({ name, ok }) => {
        if (ok) {
            log.success(name);
        } else {
            log.error(name);
        }
    });

    console.log();

    if (frontendOk && proxyOk && ollamaOk) {
        log.success(`${colors.bold}Tout fonctionne ! 🎉${colors.reset}`);
        log.info('Ouvre http://localhost:8000/index.html et teste la génération');
        process.exit(0);
    } else {
        log.error(`${colors.bold}Certains services ne sont pas disponibles${colors.reset}`);

        if (!ollamaOk) {
            log.info('\n💡 Ollama non trouvé ? Lance : ollama serve');
        }
        if (!proxyOk) {
            log.info('\n💡 Proxy non trouvé ? Lance : cd server && npm start');
        }
        if (!frontendOk) {
            log.info('\n💡 Frontend non trouvé ? Lance : python -m http.server 8000');
        }

        process.exit(1);
    }
}

main().catch((err) => {
    log.error(`Erreur : ${err.message}`);
    process.exit(1);
});
