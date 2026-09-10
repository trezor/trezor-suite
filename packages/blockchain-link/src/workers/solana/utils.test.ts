import type { ParsedTransactionWithMeta, Signature, SolanaAPI } from '@trezor/network-solana/types';

import { fetchTransactionPage } from './utils';

type TransactionResponse = ParsedTransactionWithMeta | null;

// getTransaction is called once per signature, in order, so responses are matched positionally.
const mockApi = (responses: (TransactionResponse | Error)[]) => {
    let call = 0;

    return {
        rpc: {
            getTransaction: () => {
                const response = responses[call++];

                return {
                    send: () =>
                        response instanceof Error
                            ? Promise.reject(response)
                            : Promise.resolve(response),
                };
            },
        },
    } as unknown as SolanaAPI;
};

const tx = (txid: string) =>
    ({ transaction: { signatures: [txid] } }) as unknown as ParsedTransactionWithMeta;

const signatures = ['a', 'b', 'c'] as unknown as Signature[];

describe('fetchTransactionPage', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns every transaction when the RPC answers all of them', async () => {
        const api = mockApi([tx('a'), tx('b'), tx('c')]);

        await expect(fetchTransactionPage(api, signatures)).resolves.toEqual([
            tx('a'),
            tx('b'),
            tx('c'),
        ]);
    });

    // The v1 regression: getTransaction rejects for a transaction version above the ceiling we
    // ask for, and that must not take down the sync of the whole account.
    it('drops only the rejected transaction and keeps the rest of the page', async () => {
        const api = mockApi([tx('a'), new Error('unsupported transaction version'), tx('c')]);

        await expect(fetchTransactionPage(api, signatures)).resolves.toEqual([tx('a'), tx('c')]);
    });

    it('returns an empty page when every transaction is rejected', async () => {
        const api = mockApi([new Error('boom'), new Error('boom'), new Error('boom')]);

        await expect(fetchTransactionPage(api, signatures)).resolves.toEqual([]);
    });

    it('filters out transactions the RPC returns as null', async () => {
        const api = mockApi([tx('a'), null, tx('c')]);

        await expect(fetchTransactionPage(api, signatures)).resolves.toEqual([tx('a'), tx('c')]);
    });

    it('asks the RPC for transaction versions up to v1', async () => {
        const getTransaction = jest.fn(() => ({ send: () => Promise.resolve(tx('a')) }));
        const api = { rpc: { getTransaction } } as unknown as SolanaAPI;

        await fetchTransactionPage(api, ['a'] as unknown as Signature[]);

        expect(getTransaction).toHaveBeenCalledWith(
            'a',
            expect.objectContaining({ maxSupportedTransactionVersion: 1 }),
        );
    });

    it('does not log the rejection reason, which may carry the confidential signature', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const api = mockApi([tx('a'), new Error('failed for signature deadbeef'), tx('c')]);

        await fetchTransactionPage(api, signatures);

        const [call = []] = warn.mock.calls;

        expect(warn).toHaveBeenCalledTimes(1);
        expect(call.join(' ')).not.toContain('deadbeef');
    });
});
