import { asNetworkSymbol } from '@trezor/network-module-types';

import { createChainNetworksStore } from './ChainNetworksStore';
import { createFakeChainNetwork } from '../mocks/createFakeChainNetwork';

const btc = createFakeChainNetwork({ symbol: asNetworkSymbol('btc'), balances: {}, rate: null });
const eth = createFakeChainNetwork({ symbol: asNetworkSymbol('eth'), balances: {}, rate: null });

const createSources = () => {
    let notify = () => {};
    let networks = [btc.network];

    return {
        subscribeToSources: (onChange: () => void) => {
            notify = onChange;

            return () => {};
        },
        getNetworks: jest.fn(() => [...networks]),
        change: (next: typeof networks) => {
            networks = next;
            notify();
        },
    };
};

describe(createChainNetworksStore.name, () => {
    it('publishes only when a network is added, removed or rebuilt', () => {
        const sources = createSources();
        const store = createChainNetworksStore(sources);
        const listener = jest.fn();
        store.subscribe(listener);
        const initial = store.getSnapshot();

        // A source changed, but every network kept its instance (e.g. a new block).
        sources.change([btc.network]);
        expect(listener).not.toHaveBeenCalled();
        expect(store.getSnapshot()).toBe(initial);

        sources.change([btc.network, eth.network]);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(store.getSnapshot()).toEqual([btc.network, eth.network]);
    });

    it('is current outside React, with no subscriber', () => {
        const sources = createSources();
        const store = createChainNetworksStore(sources);

        sources.change([eth.network]);

        expect(store.getSnapshot()).toEqual([eth.network]);
    });

    it('stops calling a listener that unsubscribed', () => {
        const sources = createSources();
        const store = createChainNetworksStore(sources);
        const listener = jest.fn();
        const unsubscribe = store.subscribe(listener);

        unsubscribe();
        sources.change([eth.network]);

        expect(listener).not.toHaveBeenCalled();
    });
});
