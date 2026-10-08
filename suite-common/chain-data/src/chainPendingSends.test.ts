import { QueryClient, chainQueryKeys } from '@suite-common/react-query';
import type { Transaction } from '@trezor/blockchain-link-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    PENDING_SEND_TTL_MS,
    addChainPendingSend,
    createReadChainPendingSends,
} from './chainPendingSends';

const network = { symbol: asNetworkSymbol('eth'), backendType: 'blockbook' } as const;
const account = { ...network, descriptor: '0xabc' };

const tx = (txid: string) => ({ txid }) as Transaction;

describe(createReadChainPendingSends.name, () => {
    const now = 1_700_000_000_000;
    let queryClient: QueryClient;

    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(now);
        queryClient = new QueryClient();
    });

    afterEach(() => {
        // Pending sends stay cached for their lifetime; their timers must not outlive the test.
        queryClient.clear();
        jest.restoreAllMocks();
    });

    it('reads nothing for an account that sent nothing', () => {
        expect(createReadChainPendingSends({ queryClient })(account)).toEqual([]);
    });

    it('reads the sends the history shows: neither listed nor expired', () => {
        const read = createReadChainPendingSends({ queryClient });
        [
            { transaction: tx('expired'), sentAt: now - PENDING_SEND_TTL_MS },
            { transaction: tx('listed'), sentAt: now },
            { transaction: tx('pending'), sentAt: now },
        ].forEach(pendingSend =>
            addChainPendingSend(queryClient, { network, descriptor: '0xabc', pendingSend }),
        );
        queryClient.setQueryData(chainQueryKeys.accountTransactions('eth', 'blockbook', '0xabc'), {
            pages: [{ transactions: [tx('listed')], nextCursor: null, total: 1 }],
            pageParams: [{ page: 1 }],
        });

        expect(read(account)).toEqual([tx('pending')]);
        expect(read({ ...account, backendType: 'evm-rpc' })).toEqual([]);
    });
});
