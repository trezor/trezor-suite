import {
    MAX_CONTACTS_RELAY_URLS,
    getValidContactsRelayUrls,
    isSameContactsRelayUrl,
    isValidContactsRelayUrl,
} from './contactsRelayUrls';

describe('isValidContactsRelayUrl', () => {
    it.each([
        'wss://relay.example.com',
        'wss://relay.example.com:7447/nostr',
        'WSS://Relay.Example.com',
    ])('accepts the TLS relay %s', url => {
        expect(isValidContactsRelayUrl(url)).toBe(true);
    });

    it.each(['ws://localhost:7777', 'ws://127.0.0.1:7777'])('accepts the local relay %s', url => {
        expect(isValidContactsRelayUrl(url)).toBe(true);
    });

    it.each([
        'ws://relay.example.com',
        'ws://192.168.1.10:7777',
        'https://relay.example.com',
        'http://localhost:7777',
        'wss://user:secret@relay.example.com',
        'wss://relay.example.com/?auth=secret',
        'wss://relay.example.com/#secret',
        'wss://relay.example.com/?',
        'relay.example.com',
        'wss://',
        '',
    ])('rejects %s', url => {
        expect(isValidContactsRelayUrl(url)).toBe(false);
    });
});

describe('getValidContactsRelayUrls', () => {
    it('trims, drops invalid URLs and duplicates, and keeps the order', () => {
        expect(
            getValidContactsRelayUrls([
                ' wss://b.example.com ',
                'ws://relay.example.com',
                'wss://a.example.com',
                'wss://b.example.com',
                'ws://localhost:7777',
            ]),
        ).toEqual(['wss://b.example.com', 'wss://a.example.com', 'ws://localhost:7777']);
    });

    it('keeps the first spelling of a relay that is listed several times', () => {
        expect(
            getValidContactsRelayUrls([
                'wss://relay.example.com',
                'wss://relay.example.com/',
                'WSS://Relay.Example.com',
                'wss://relay.example.com:443',
                'wss://relay.example.com:7447',
            ]),
        ).toEqual(['wss://relay.example.com', 'wss://relay.example.com:7447']);
    });

    it(`keeps at most ${MAX_CONTACTS_RELAY_URLS} relays`, () => {
        const urls = Array.from(
            { length: MAX_CONTACTS_RELAY_URLS + 1 },
            (_, index) => `wss://relay${index}.example.com`,
        );

        expect(getValidContactsRelayUrls(urls)).toEqual(urls.slice(0, MAX_CONTACTS_RELAY_URLS));
    });

    it('skips entries that are not strings', () => {
        expect(getValidContactsRelayUrls([1, null, 'wss://relay.example.com'])).toEqual([
            'wss://relay.example.com',
        ]);
    });
});

describe('isSameContactsRelayUrl', () => {
    it.each(['wss://relay.example.com/', 'WSS://Relay.Example.com', 'wss://relay.example.com:443'])(
        'matches %s to wss://relay.example.com',
        url => {
            expect(isSameContactsRelayUrl('wss://relay.example.com', url)).toBe(true);
        },
    );

    it.each(['wss://relay.example.com:7447', 'wss://relay.example.com/nostr', 'not a url'])(
        'tells %s apart from wss://relay.example.com',
        url => {
            expect(isSameContactsRelayUrl('wss://relay.example.com', url)).toBe(false);
        },
    );

    it('never matches two unparsable URLs', () => {
        expect(isSameContactsRelayUrl('not a url', 'not a url')).toBe(false);
    });
});
