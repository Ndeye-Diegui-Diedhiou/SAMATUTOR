const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');

(async function() {
  try {
    console.log('Starting local a11y scan...');
    const htmlPath = path.resolve(__dirname, '..', 'index.html');
    console.log('Reading', htmlPath);
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Avoid executing in-page scripts to keep scan deterministic, but allow window.eval
    const dom = new JSDOM(html, { runScripts: 'outside-only' });
    const { window } = dom;

    console.log('Injecting axe-core into JSDOM via window.eval');
    const axeSource = axe && axe.source ? axe.source : axe;
    window.eval(axeSource);
    console.log('window.axe present:', !!(window.axe && typeof window.axe.run === 'function'));


    console.log('Waiting for in-page scripts to run (if any)');
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log('Running axe...');
    let results;
    const runWithTimeout = (promise, ms) => Promise.race([
      promise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('axe.run timed out')), ms))
    ]);

    try {
      results = await runWithTimeout(window.axe.run(window.document), 10000);
    } catch (e) {
      console.warn('axe.run failed or timed out, retrying without color-contrast:', e && e.message);
      // Retry with color-contrast disabled which sometimes requires canvas support
      results = await runWithTimeout(window.axe.run(window.document, { rules: { 'color-contrast': { enabled: false } } }), 10000);
    }

    const out = {
      date: new Date().toISOString(),
      url: 'index.html (local)',
      violations: results.violations || [],
      passes: results.passes || []
    };

    fs.writeFileSync(path.resolve(__dirname, 'a11y-report.json'), JSON.stringify(out, null, 2));

    console.log(`A11y check complete — ${results.violations.length} violations found. Report saved to tools/a11y-report.json`);
    if (results.violations.length) {
      results.violations.forEach(v => {
        console.log(`\n[${v.id}] ${v.help} — Impact: ${v.impact}`);
        v.nodes.slice(0,3).forEach(node => console.log('  -', node.html));
      });
    }
  } catch (err) {
    console.error('A11y scan failed:', err);
    process.exit(1);
  }
})();