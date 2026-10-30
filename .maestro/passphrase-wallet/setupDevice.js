var BASE = 'http://127.0.0.1:9011';

function post(path, body) {
    // Maestro's http.post requires a request body, so always send at least {}.
    return http.post(BASE + path, { body: JSON.stringify(body || {}) });
}

post('/connect');
post('/log', { text: 'maestro open-passphrase' });
post('/start-emu', { model: 'T3T1', wipe: true, version: '2-latest' });
post('/setup-emu', {
    label: 'Safe 5 - Tester',
    mnemonic: 'mnemonic_all',
    // Passphrase protection on, so the app can open a passphrase wallet.
    passphrase_protection: true,
});
post('/start-bridge', { version: 'node-bridge' });
