import { QueryClient } from '@suite-common/react-query';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createChainQueryInvalidator } from './createChainQueryInvalidator';

const KEYS = {
    btcBalance: ['chain', 'btc', 'blockbook', 'account', 'zpub1', 'balance'],
    btcOtherBalance: ['chain', 'btc', 'blockbook', 'account', 'zpub2', 'balance'],
    btcRate: ['chain', 'btc', 'blockbook', 'fiat-rate', 'usd'],
    ethBalance: ['chain', 'eth', 'blockbook', 'account', '0xabc', 'balance'],
};

const btc = asNetworkSymbol('btc');

const setUp = () => {
    const queryClient = new QueryClient();
    Object.values(KEYS).forEach(queryKey => queryClient.setQueryData(queryKey, 'cached'));

    const invalidatedKeys = () =>
        Object.entries(KEYS)
            .filter(([, queryKey]) => queryClient.getQueryState(queryKey)?.isInvalidated)
            .map(([name]) => name);

    return { invalidator: createChainQueryInvalidator({ queryClient }), invalidatedKeys };
};

describe('createChainQueryInvalidator', () => {
    it('refreshes every account of the network on a new block, but not its rates', async () => {
        const { invalidator, invalidatedKeys } = setUp();

        await invalidator.onBlock(btc, 'blockbook');

        expect(invalidatedKeys()).toEqual(['btcBalance', 'btcOtherBalance']);
    });

    it('refreshes only the notified account', async () => {
        const { invalidator, invalidatedKeys } = setUp();

        await invalidator.onAccountNotification(btc, 'blockbook', 'zpub1');

        expect(invalidatedKeys()).toEqual(['btcBalance']);
    });

    it('refreshes everything of the network when its backend changes', async () => {
        const { invalidator, invalidatedKeys } = setUp();

        await invalidator.onBackendChanged(btc);

        expect(invalidatedKeys()).toEqual(['btcBalance', 'btcOtherBalance', 'btcRate']);
    });
});
