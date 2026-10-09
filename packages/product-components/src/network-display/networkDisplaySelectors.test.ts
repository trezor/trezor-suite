import { type NetworkConfigState, asNetworkSymbol } from '@trezor/network-module-types';

import {
    selectDisplaySymbol,
    selectNetworkConfig,
    selectNetworkConfigByCoingeckoId,
    selectNetworkDisplayConfig,
    selectNetworkOptions,
} from './networkDisplaySelectors';

const bitcoin = asNetworkSymbol('btc');
const ethereum = asNetworkSymbol('eth');
const unknownNetwork = asNetworkSymbol('custom-network');

const state: NetworkConfigState = {
    networks: {
        [bitcoin]: { name: 'Bitcoin' },
        [ethereum]: { name: 'Ethereum' },
    },
};

it('keeps a network config selection stable when another network changes', () => {
    const config = selectNetworkConfig(state, bitcoin);
    const updatedState: NetworkConfigState = {
        networks: {
            ...state.networks,
            [ethereum]: { name: 'Updated Ethereum' },
        },
    };

    expect(selectNetworkConfig(updatedState, bitcoin)).toBe(config);
    expect(selectNetworkConfig(updatedState, ethereum)?.name).toBe('Updated Ethereum');
    expect(selectNetworkConfig(updatedState, 'unregistered')).toBeUndefined();
});

it('selects logo metadata by Coingecko ID', () => {
    const configuredState: NetworkConfigState = {
        networks: { [bitcoin]: { name: 'Bitcoin', coingeckoId: 'bitcoin' } },
    };

    expect(selectNetworkConfigByCoingeckoId(configuredState, 'bitcoin')).toEqual({
        symbol: bitcoin,
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
    });
    expect(selectNetworkConfigByCoingeckoId(configuredState, 'missing')).toBeUndefined();
    expect(selectNetworkConfigByCoingeckoId({ networks: null }, 'bitcoin')).toBeUndefined();
});

it('preserves native display symbols and token symbol truncation', () => {
    const configuredState: NetworkConfigState = {
        networks: { [bitcoin]: { name: 'Bitcoin', displaySymbol: 'BTC' } },
    };

    expect(selectDisplaySymbol(configuredState, 'btc')).toBe('BTC');
    expect(selectDisplaySymbol(configuredState, 'btc', 'contract')).toBe('btc');
    expect(selectDisplaySymbol(configuredState, 'long-token-symbol')).toBe('long-token...');
    expect(selectDisplaySymbol({ networks: null }, 'btc')).toBe('btc');
});

describe('selectNetworkOptions', () => {
    it('uses all configured networks when no list is supplied', () => {
        expect(selectNetworkOptions(state)).toEqual([
            { symbol: bitcoin, name: 'Bitcoin' },
            { symbol: ethereum, name: 'Ethereum' },
        ]);
    });

    it('preserves an explicit list and falls back to symbols for missing config', () => {
        expect(selectNetworkOptions(state, [ethereum, unknownNetwork, bitcoin])).toEqual([
            { symbol: ethereum, name: 'Ethereum' },
            { symbol: unknownNetwork, name: unknownNetwork },
            { symbol: bitcoin, name: 'Bitcoin' },
        ]);
        expect(selectNetworkOptions(state, [])).toEqual([]);
    });

    it('handles config that has not loaded yet', () => {
        const unloadedState: NetworkConfigState = { networks: null };

        expect(selectNetworkOptions(unloadedState)).toEqual([]);
        expect(selectNetworkOptions(unloadedState, [bitcoin])).toEqual([
            { symbol: bitcoin, name: bitcoin },
        ]);
    });

    it('keeps the snapshot stable until the selected config changes', () => {
        const symbols = [bitcoin];
        const options = selectNetworkOptions(state, symbols);

        expect(selectNetworkOptions({ ...state }, symbols)).toBe(options);
        expect(
            selectNetworkOptions({ networks: { [bitcoin]: { name: 'Updated Bitcoin' } } }, symbols),
        ).toEqual([{ symbol: bitcoin, name: 'Updated Bitcoin' }]);
    });
});

describe('selectNetworkDisplayConfig', () => {
    const base = asNetworkSymbol('base');
    const bsc = asNetworkSymbol('bsc');
    const configuredState: NetworkConfigState = {
        networks: {
            [base]: {
                name: 'Base',
                displaySymbol: 'ETH',
                settlementLayer: ethereum,
                features: ['tokens'],
            },
            [ethereum]: { name: 'Ethereum', displaySymbol: 'ETH', features: ['tokens'] },
            [bsc]: { name: 'BNB Smart Chain', displaySymbol: 'BNB', features: ['tokens'] },
        },
    };

    it('resolves display aliases while preferring canonical network symbols', () => {
        expect(selectNetworkDisplayConfig(configuredState, 'ETH')?.symbol).toBe(ethereum);
        expect(selectNetworkDisplayConfig(configuredState, 'BNB')?.symbol).toBe(bsc);
        expect(selectNetworkDisplayConfig(configuredState, 'base')).toMatchObject({
            symbol: base,
            settlementLayer: ethereum,
            features: ['tokens'],
        });
        expect(selectNetworkDisplayConfig(configuredState, 'unregistered')).toBeUndefined();
        expect(selectNetworkDisplayConfig({ networks: null }, 'eth')).toBeUndefined();
    });

    it('keeps the selected config stable until network configuration changes', () => {
        const config = selectNetworkDisplayConfig(configuredState, 'base');

        expect(selectNetworkDisplayConfig({ ...configuredState }, 'base')).toBe(config);
        expect(
            selectNetworkDisplayConfig({ networks: { [base]: { name: 'Updated Base' } } }, 'base'),
        ).toEqual({ symbol: base, name: 'Updated Base' });
    });
});
