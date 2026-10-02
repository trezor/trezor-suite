import { type NetworkConfigState, asNetworkSymbol } from '@trezor/network-module-types';

import { selectNetworkOptions } from './networkDisplaySelectors';

const bitcoin = asNetworkSymbol('btc');
const ethereum = asNetworkSymbol('eth');
const unknownNetwork = asNetworkSymbol('custom-network');

const state: NetworkConfigState = {
    networks: {
        [bitcoin]: { name: 'Bitcoin' },
        [ethereum]: { name: 'Ethereum' },
    },
};

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
