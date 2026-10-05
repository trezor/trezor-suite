import { WARDD_DEFAULT_URL, isValidWarddUrl } from './warddUrl';

describe('isValidWarddUrl', () => {
    it.each([WARDD_DEFAULT_URL, 'ws://localhost:21329', 'ws://127.0.0.1:4000'])(
        'accepts the local wardd %s',
        url => {
            expect(isValidWarddUrl(url)).toBe(true);
        },
    );

    it.each([
        'wss://127.0.0.1:21329',
        'ws://192.168.1.10:21329',
        'ws://wardd.example.com:21329',
        'http://127.0.0.1:21329',
        'ws://user:secret@127.0.0.1:21329',
        '127.0.0.1:21329',
        '',
    ])('rejects %s', url => {
        expect(isValidWarddUrl(url)).toBe(false);
    });
});
