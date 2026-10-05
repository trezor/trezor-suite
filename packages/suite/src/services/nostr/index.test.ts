import { DEFAULT_RELAY_URLS, getEffectiveRelayUrls } from './index';

describe('getEffectiveRelayUrls', () => {
    it('connects to no relay until the user configures one', () => {
        // The address exchange is plain text, so no relay may be used without the user adding it.
        expect(DEFAULT_RELAY_URLS).toEqual([]);
        expect(getEffectiveRelayUrls([])).toEqual([]);
    });

    it('uses the configured relays', () => {
        expect(getEffectiveRelayUrls(['wss://relay.example.com'])).toEqual([
            'wss://relay.example.com',
        ]);
    });
});
