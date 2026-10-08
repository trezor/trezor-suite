import { EMPTY_RUNTIME_NETWORK_PREFERENCES } from '@trezor/network-module-suite-common-types';

import { resolveRuntimeEvmNetworks } from './resolveRuntimeEvmNetworks';

const entry = (symbol: string, chainId: number) => ({
    symbol,
    chainId,
    name: `Chain ${symbol}`,
    nativeSymbol: symbol.toUpperCase(),
    decimals: 18,
    rpcUrls: [`https://${symbol}.example.com`],
});

const builtIn = { reservedSymbols: new Set(['eth', 'base']), reservedChainIds: new Set([1, 8453]) };

const summarize = (resolution: ReturnType<typeof resolveRuntimeEvmNetworks>) =>
    resolution.networks.map(({ key, isEnabled }) => `${key}${isEnabled ? ' on' : ''}`);

describe(resolveRuntimeEvmNetworks.name, () => {
    it("takes Trezor's valid entries, skipping what the app builds in or cannot sign", () => {
        const resolution = resolveRuntimeEvmNetworks({
            trezorListed: [
                entry('abc', 1001),
                entry('eth', 1002),
                entry('def', 1),
                { ...entry('ghi', 1003), decimals: 6 },
            ],
            preferences: EMPTY_RUNTIME_NETWORK_PREFERENCES,
            builtIn,
        });

        expect(summarize(resolution)).toEqual(['trezor:abc']);
    });

    it("prefers Trezor's network over the user's with the same symbol or chain ID", () => {
        const resolution = resolveRuntimeEvmNetworks({
            trezorListed: [entry('abc', 1001)],
            preferences: {
                userDefinitions: [entry('abc', 2001), entry('xyz', 1001), entry('own', 3001)],
                enabled: [],
            },
            builtIn,
        });

        expect(summarize(resolution)).toEqual(['trezor:abc', 'user:own']);
        expect(resolution.shadowedUserDefinitions.map(({ symbol }) => symbol)).toEqual([
            'abc',
            'xyz',
        ]);
    });

    it('turns on only what the user turned on, by source and symbol', () => {
        const resolution = resolveRuntimeEvmNetworks({
            trezorListed: [entry('abc', 1001)],
            preferences: {
                userDefinitions: [entry('own', 3001)],
                // The user's consent to their own `abc` never carries over to Trezor's `abc`.
                enabled: ['user:abc', 'user:own'],
            },
            builtIn,
        });

        expect(summarize(resolution)).toEqual(['trezor:abc', 'user:own on']);
    });

    it('drops a stored network whose symbol a later release builds in', () => {
        const resolution = resolveRuntimeEvmNetworks({
            trezorListed: [],
            preferences: { userDefinitions: [entry('base', 1001)], enabled: ['user:base'] },
            builtIn,
        });

        expect(resolution.networks).toEqual([]);
    });

    it('reserves built-in and runtime symbols and chain IDs for a new network', () => {
        const { reservations } = resolveRuntimeEvmNetworks({
            trezorListed: [entry('abc', 1001)],
            preferences: EMPTY_RUNTIME_NETWORK_PREFERENCES,
            builtIn,
        });

        expect([...reservations.reservedSymbols]).toEqual(['eth', 'base', 'abc']);
        expect([...reservations.reservedChainIds]).toEqual([1, 8453, 1001]);
    });
});
