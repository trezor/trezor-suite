import { asNetworkSymbol } from '@trezor/network-module-types';

import { ChainNetworkError } from './ChainNetworkError';
import {
    type FetchConnectTransactionsDeps,
    type FetchConnectTransactionsParams,
    createFetchConnectTransactions,
} from './createFetchConnectTransactions';

const DESCRIPTOR = 'confidential-descriptor';

const mockGetAccountInfo = jest.fn();

const deps: FetchConnectTransactionsDeps = {
    getTrezorConnect: () => ({ getAccountInfo: mockGetAccountInfo }),
};

const fetchTransactions = createFetchConnectTransactions(deps);

const { signal } = new AbortController();

const tx = (txid: string) => ({ txid });

const getParams = (
    overrides: Partial<FetchConnectTransactionsParams> = {},
): FetchConnectTransactionsParams => ({
    ref: { symbol: asNetworkSymbol('btc'), descriptor: DESCRIPTOR, accountType: 'normal' },
    cursor: { page: 1 },
    signal,
    pagination: 'page',
    pageSize: 25,
    useConnectionIdentity: false,
    useStellarContractTokens: false,
    ...overrides,
});

const respond = (payload: object) =>
    mockGetAccountInfo.mockResolvedValue({
        success: true,
        payload: { history: { total: 3, transactions: [tx('a')] }, ...payload },
    });

describe('createFetchConnectTransactions', () => {
    beforeEach(() => {
        mockGetAccountInfo.mockReset();
    });

    it('asks for one page of transactions with the network rules', async () => {
        respond({ page: { index: 1, size: 25, total: 1 } });

        await fetchTransactions(getParams({ gap: 40, cursor: { page: 2 } }));

        expect(mockGetAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                coin: 'btc',
                descriptor: DESCRIPTOR,
                details: 'txs',
                page: 2,
                pageSize: 25,
                gap: 40,
                identity: undefined,
            }),
        );
    });

    it.each([
        { page: { index: 1, size: 25, total: 3 }, expected: { page: 2 } },
        { page: { index: 3, size: 25, total: 3 }, expected: null },
        { page: undefined, expected: null },
    ])('pages Blockbook until the last page: $page', async ({ page, expected }) => {
        respond({ page, addresses: { used: [], unused: [], change: [] } });

        await expect(fetchTransactions(getParams())).resolves.toEqual({
            transactions: [tx('a')],
            nextCursor: expected,
            total: 3,
            addresses: { used: [], unused: [], change: [] },
        });
    });

    it.each([
        { page: { index: 0, size: 8, total: 20 }, expected: { page: 2 } },
        { page: { index: 2, size: 8, total: 20 }, expected: null },
    ])('pages Solana by its transaction count: $page', async ({ page, expected }) => {
        respond({ page });

        const result = await fetchTransactions(getParams({ pagination: 'solana-page' }));

        expect(result.nextCursor).toEqual(expected);
    });

    it('pages Ripple by marker and never sends a marker for the first page', async () => {
        const marker = { ledger: 10, seq: 2 };
        respond({ marker, history: { total: -1, transactions: [tx('a')] } });

        const first = await fetchTransactions(
            getParams({ pagination: 'ripple-marker', cursor: { page: 1, marker } }),
        );
        expect(mockGetAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({ marker: undefined }),
        );
        expect(first).toMatchObject({ nextCursor: { page: 2, marker }, total: null });

        respond({ history: { total: -1, transactions: [] } });
        const last = await fetchTransactions(
            getParams({ pagination: 'ripple-marker', cursor: { page: 2, marker } }),
        );
        expect(mockGetAccountInfo).toHaveBeenLastCalledWith(expect.objectContaining({ marker }));
        expect(last.nextCursor).toBeNull();
    });

    it('pages Stellar by cursor until a short page', async () => {
        respond({
            stellarCursor: 'cursor-2',
            history: { total: -1, transactions: [tx('a'), tx('b')] },
        });

        const full = await fetchTransactions(
            getParams({
                pagination: 'stellar-cursor',
                pageSize: 2,
                useStellarContractTokens: true,
                ref: {
                    symbol: asNetworkSymbol('xlm'),
                    descriptor: DESCRIPTOR,
                    accountType: 'normal',
                    watchedTokens: ['USDC-GISSUER', 'CCONTRACT'],
                },
            }),
        );
        expect(full.nextCursor).toEqual({ page: 2, pageCursor: 'cursor-2' });
        expect(mockGetAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({
                pageCursor: undefined,
                stellarContractTokens: ['CCONTRACT'],
            }),
        );

        respond({ stellarCursor: 'cursor-3', history: { total: -1, transactions: [tx('c')] } });
        const short = await fetchTransactions(
            getParams({
                pagination: 'stellar-cursor',
                pageSize: 2,
                cursor: { page: 2, pageCursor: 'cursor-2' },
            }),
        );
        expect(mockGetAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({ page: 2, pageCursor: 'cursor-2' }),
        );
        expect(short.nextCursor).toBeNull();
    });

    it('fails with a code and never with the backend message', async () => {
        mockGetAccountInfo.mockResolvedValue({
            success: false,
            error: { message: `Invalid descriptor ${DESCRIPTOR}` },
        });

        const error = await fetchTransactions(getParams()).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ChainNetworkError);
        expect(String(error)).not.toContain(DESCRIPTOR);
    });
});
