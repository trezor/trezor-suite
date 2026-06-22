var BASE_URL = 'http://127.0.0.1:9011';

http.post(BASE_URL + '/setup-emulator', { body: '{}' });
http.post(BASE_URL + '/start-bridge', { body: '{}' });
