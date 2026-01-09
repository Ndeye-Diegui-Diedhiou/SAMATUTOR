require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');
const { generatePdf } = require('./typst-generator');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const USE_OLLAMA = (process.env.USE_OLLAMA || '').toLowerCase() === 'true';

const app = express();
const PORT = process.env.PORT || 3000;

// Lecture de la clé OpenAI depuis les variables d'env
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey && !USE_OLLAMA) {
    console.warn('⚠️  OPENAI_API_KEY non défini dans .env. Ollama uniquement en mode USE_OLLAMA=true');
}

// Initialisation du client OpenAI avec la clé lue (si disponible)
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Security middlewares
// app.use(helmet()); // Temporairement désactivé pour debug
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));

// Simple CORS config - adjust CORS_ORIGIN in production
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Servir les PDFs générés
app.use('/download', express.static(path.join(__dirname, 'generated-pdfs')));

// Basic rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health
app.get('/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// AI proxy endpoint

app.post('/api/ai', async (req, res) => {
    console.log('Requête reçue sur /api/ai');
    console.log('Body:', req.body);
    try {
        const { messages, model } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            console.log('Messages manquants ou invalides');
            return res.status(400).json({ error: 'Messages requis et doit être un tableau' });
        }

        // Decide provider: Ollama if env flag is set or model starts with 'ollama:'
        const wantsOllama = USE_OLLAMA || (typeof model === 'string' && model.startsWith('ollama:'));
        if (wantsOllama) {
            const ollamaModel = (typeof model === 'string' && model.startsWith('ollama:'))
                ? model.replace('ollama:', '')
                : (process.env.OLLAMA_MODEL || 'llama3');
            console.log(`Appel à Ollama (${OLLAMA_HOST}) avec le modèle: ${ollamaModel}`);
            // Map messages to Ollama's format (role/content stays same)
            const resp = await fetch(`${OLLAMA_HOST}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: ollamaModel,
                    messages: messages,
                    stream: false
                })
            });
            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(`Ollama error ${resp.status}: ${txt}`);
            }
            const data = await resp.json();
            // Ollama returns { message: { role, content }, ... }
            const content = data?.message?.content || '';
            return res.json({ choices: [{ message: { content } }] });
        } else {
            console.log('Appel à OpenAI...');
            if (!openai) {
                return res.status(500).json({ error: 'OpenAI non configuré. OPENAI_API_KEY manquante dans .env' });
            }
            const completion = await openai.chat.completions.create({
                model: model || 'gpt-3.5-turbo',
                messages: messages,
            });
            console.log('Réponse OpenAI reçue');
            return res.json({ 
                choices: [{ 
                    message: { content: completion.choices[0].message.content } 
                }] 
            });
        }
    } catch (error) {
        console.error('Erreur dans /api/ai:', error);
        res.status(500).json({ error: 'Erreur IA', details: error.message });
    }
});

// Endpoint pour générer PDF avec Typst
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { title, objectives, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ 
                error: 'title et content sont requis' 
            });
        }

        console.log('📄 Génération de PDF:', title);

        const result = generatePdf(title, objectives, content);

        if (!result.success) {
            return res.status(500).json({ 
                error: result.error || 'Erreur lors de la génération du PDF' 
            });
        }

        res.json({
            success: true,
            pdfUrl: result.pdfUrl,
            fileName: result.fileName,
            size: result.size
        });
    } catch (error) {
        console.error('Erreur génération PDF:', error);
        res.status(500).json({ 
            error: `Erreur génération PDF: ${error.message}` 
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Proxy IA lancé sur http://localhost:${PORT}`);
    console.log(`🤖 Mode: ${USE_OLLAMA ? 'Ollama' : 'OpenAI'}`);
    console.log(`📄 Support Typst: actif`);
});