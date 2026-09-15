var BASE = 'http://127.0.0.1:9011';

function post(path, body) {
    // Maestro's http.post requires a request body, so always send at least {}.
    return http.post(BASE + path, { body: JSON.stringify(body || {}) });
}

post('/connect');
post('/log', { text: 'maestro onboard-and-connect' });
post('/start-emu', { model: 'T3T1', wipe: true, version: '2-latest' });
post('/setup-emu', {
    label: 'Safe 5 - Tester',
    // 'all all all ...' seed has populated accounts so discovery has history to find
    mnemonic: 'mnemonic_all',
    passphrase_protection: false,
});
post('/start-bridge', { version: 'node-bridge' });
