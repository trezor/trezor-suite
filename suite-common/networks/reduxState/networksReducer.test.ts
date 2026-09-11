import type { NetworkMetadata } from './NetworkMetadata';
import { networksActions, networksReducer } from './networksReducer';

const bitcoin: NetworkMetadata = {
    symbol: 'btc',
    name: 'Bitcoin',
    displaySymbol: 'BTC',
    networkType: 'bitcoin',
    decimals: 8,
    testnet: false,
    color: '#f7931a',
    protocols: [],
    explorer: {
        base: 'https://mempool.space',
        tx: 'https://mempool.space/tx/',
        address: 'https://mempool.space/address/',
    },
};

describe('networksReducer', () => {
    it('starts unloaded without loading network configuration', () => {
        expect(networksReducer(undefined, { type: 'init' })).toBeNull();
    });

    it('stores the supplied configuration and network order', () => {
        const testnet: NetworkMetadata = { ...bitcoin, symbol: 'test', testnet: true };

        const state = networksReducer(undefined, networksActions.setNetworks([testnet, bitcoin]));

        expect(state).toEqual({
            test: testnet,
            btc: bitcoin,
        });
        expect(Object.values(state ?? {})).toEqual([testnet, bitcoin]);
    });

    it('replaces the snapshot without retaining unavailable networks', () => {
        const previousState = networksReducer(undefined, networksActions.setNetworks([bitcoin]));

        expect(networksReducer(previousState, networksActions.setNetworks([]))).toEqual({});
        expect(previousState).toEqual({ btc: bitcoin });
    });
});
