var BASE = 'http://127.0.0.1:9011';

function post(path, body) {
    return http.post(BASE + path, { body: JSON.stringify(body || {}) });
}

// Confirm the passphrase on the device. The shim polls the device screen and
// confirms every passphrase prompt (entry + any verification re-prompt) until it
// clears — the app's own UI stays on the loading screen during this, so we can't
// drive it from Maestro selectors. Returns how many confirms happened + the
// sequence of device screens, logged for diagnostics.
var res = post('/confirm-passphrase');
console.log('[passphrase] confirm-passphrase -> ' + (res && res.body));
