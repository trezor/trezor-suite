var BASE = 'http://127.0.0.1:9011';

http.post(BASE + '/stop-emu', { body: '{}' });
http.post(BASE + '/stop-bridge', { body: '{}' });
http.post(BASE + '/disconnect', { body: '{}' });
