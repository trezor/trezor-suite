import {
    EMPTY_RUNTIME_NETWORK_PREFERENCES,
    getRuntimeNetworkKey,
    withEnabled,
    withUserDefinition,
    withoutUserDefinition,
} from './RuntimeNetworkPreferences';

describe('RuntimeNetworkPreferences', () => {
    it("keeps one of the user's definitions per symbol, off until enabled", () => {
        const preferences = withUserDefinition(
            withUserDefinition(EMPTY_RUNTIME_NETWORK_PREFERENCES, {
                symbol: 'abc',
                chainId: 1,
            } as never),
            { symbol: 'abc', chainId: 2 } as never,
        );

        expect(preferences).toEqual({
            userDefinitions: [{ symbol: 'abc', chainId: 2 }],
            enabled: [],
        });
    });

    it('turns a network on and off by its source and symbol', () => {
        const userKey = getRuntimeNetworkKey('user', 'abc');
        const trezorKey = getRuntimeNetworkKey('trezor', 'abc');

        const enabled = withEnabled(
            withEnabled(EMPTY_RUNTIME_NETWORK_PREFERENCES, userKey, true),
            trezorKey,
            true,
        );
        expect(enabled.enabled).toEqual(['user:abc', 'trezor:abc']);
        expect(withEnabled(enabled, userKey, false).enabled).toEqual(['trezor:abc']);
    });

    it("forgets a removed definition and that it was on, leaving Trezor's network with the same symbol on", () => {
        const preferences = withEnabled(
            withEnabled(
                withUserDefinition(EMPTY_RUNTIME_NETWORK_PREFERENCES, { symbol: 'abc' }),
                getRuntimeNetworkKey('user', 'abc'),
                true,
            ),
            getRuntimeNetworkKey('trezor', 'abc'),
            true,
        );

        expect(withoutUserDefinition(preferences, 'abc')).toEqual({
            userDefinitions: [],
            enabled: ['trezor:abc'],
        });
    });
});
