const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

(async function() {
  console.log('Starting smoke tests...');
  const htmlPath = path.resolve(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // DOM without loading external scripts automatically
  const dom = new JSDOM(html);
  const { window } = dom;

  // Inject app JS directly so functions are available (avoids external resource loading in JSDOM)
  const appJs = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'app.js'), 'utf8');
  // Evaluate app JS inside the JSDOM window context (make window/document available)
  const scriptToEval = '(function(window, document){\n' + appJs + '\n})(this, this.document);';
  window.eval(scriptToEval);
  console.log('Injected app.js into JSDOM');

  // Provide a mock fetch BEFORE the app code uses it
  window.__PROXY_KEY__ = 'testkey';
  window.fetch = async (endpoint, payload) => {
    console.log('mock fetch called for', endpoint);
    // Simple stub responding with formats expected by the front-end
    const body = payload && payload.body ? JSON.parse(payload.body) : {};
    // Document generation (returns HTML-like in JSON)
    if (body.messages && body.messages[0] && body.messages[0].content && body.messages[0].content.includes('Génère un')) {
      const response = { choices: [{ message: { content: '<h1>Document généré</h1><p>Contenu</p>' } }] };
      return { ok: true, status: 200, json: async () => response };
    }

    // Tuteur AI
    if (body.messages && body.messages[0] && body.messages[0].content && body.messages[0].content.includes('Tu es un tuteur')) {
      const response = { choices: [{ message: { content: "Que veux-tu apprendre aujourd'hui ?" } }] };
      return { ok: true, status: 200, json: async () => response };
    }

    // Quiz request
    if (body.messages && body.messages[0] && body.messages[0].content && body.messages[0].content.includes('Génère un quiz')) {
      const quiz = { questions: [{ question: 'Q1', options: ['a','b','c','d'], correct: 0 }] };
      return { ok: true, status: 200, json: async () => quiz };
    }

    return { ok: true, status: 200, json: async () => ({ text: 'ok' }) };
  };

  // Wait for scripts to be loaded
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // Fill login form
    window.document.getElementById('email').value = 'dev@example.com';
    window.document.getElementById('fullName').value = 'Dev User';
    window.document.getElementById('userType').value = 'enseignant';

    // Call login
    console.log('Calling login()');
    await window.login();
    console.log('login() returned');

    // Check main app visible
    const mainApp = window.document.getElementById('mainApp');
    console.log('mainApp classes:', mainApp ? mainApp.className : 'none');
    if (!mainApp || mainApp.classList.contains('hidden')) throw new Error('Main app not visible after login');

    // Ensure sidebar has items
    const sidebar = window.document.getElementById('sidebarNav');
    if (!sidebar || sidebar.children.length === 0) throw new Error('Sidebar items not generated');

    // Navigate to create doc and trigger generation
    const titleEl = window.document.getElementById('docTitle');
    if (titleEl) titleEl.value = 'Test document';
    const objEl = window.document.getElementById('docObjectifs');
    if (objEl) objEl.value = 'Tester la génération';

    // Run generate
    console.log('Calling genererDocument()');
    await window.genererDocument();

    // Wait for generation
    await new Promise(resolve => setTimeout(resolve, 200));
    const preview = window.document.getElementById('documentPreview');
    console.log('Preview innerHTML length:', preview ? preview.innerHTML.length : 0);
    if (!preview || !preview.innerHTML.includes('Document généré')) throw new Error('Document generation failed');

    // Tuteur: switch view and send message
    if (window.showView) window.showView('tuteur');
    await new Promise(resolve => setTimeout(resolve, 100));
    const chatInput = window.document.getElementById('chatInput');
    if (chatInput) { chatInput.value = 'Bonjour'; await window.sendMessage(); }
    await new Promise(resolve => setTimeout(resolve, 200));
    const chatMessages = window.document.getElementById('chatMessages');
    if (!chatMessages || !chatMessages.innerHTML.includes('Que veux-tu apprendre')) throw new Error('Tuteur reply not present');

    console.log('Smoke tests passed — login, create document, and tuteur flows OK');
    process.exit(0);
  } catch (err) {
    console.error('Smoke tests failed:', err);
    process.exit(1);
  }
})();