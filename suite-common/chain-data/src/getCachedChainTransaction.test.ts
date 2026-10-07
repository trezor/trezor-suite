import { QueryClient, chainQueryKeys } from '@suite-common/react-query';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getCachedChainTransaction } from './getCachedChainTransaction';

const account = {
    symbol: asNetworkSymbol('btc'),
    backendType: 'blockbook',
    descriptor: 'zpub',
} as const;

describe('getCachedChainTransaction', () => {
    it('finds a transaction among the loaded pages and loads nothing', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(chainQueryKeys.accountTransactions('btc', 'blockbook', 'zpub'), {
            pages: [
                { transactions: [{ txid: 'a' }], nextCursor: { page: 2 }, total: 2 },
                { transactions: [{ txid: 'b' }], nextCursor: null, total: 2 },
            ],
            pageParams: [{ page: 1 }, { page: 2 }],
        });

        expect(getCachedChainTransaction(queryClient, account, 'b')).toEqual({ txid: 'b' });
        expect(getCachedChainTransaction(queryClient, account, 'c')).toBeUndefined();
        expect(
            getCachedChainTransaction(queryClient, { ...account, descriptor: 'other' }, 'a'),
        ).toBeUndefined();
    });
});
