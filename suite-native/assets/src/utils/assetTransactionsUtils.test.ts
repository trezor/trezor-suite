import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import {
    type AssetAccountHistory,
    getAccountPaging,
    getAssetTokenTransfers,
    groupAssetTransactionsByDay,
    mergeAssetTransactions,
    takeWholeTransactions,
} from './assetTransactionsUtils';

const FIRST = 'first' as AccountKey;
const SECOND = 'second' as AccountKey;

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress;

const DAY = 24 * 60 * 60;
const NOON = 1_700_049_600;

type MockTransactionParams = {
    txid: string;
    blockHeight?: number;
    blockTime?: number;
    tokens?: TokenAddress[];
};

const mockTransaction = ({
    txid,
    blockHeight = 0,
    blockTime = NOON,
    tokens = [],
}: MockTransactionParams) =>
    ({
        txid,
        blockHeight,
        blockTime,
        tokens: tokens.map(contract => ({ contract, amount: '1' })),
    }) as unknown as WalletAccountTransaction;

type MockAccountHistoryParams = {
    accountKey: AccountKey;
    blockHeights: number[];
    hasMoreTransactions?: boolean;
};

const mockAccountHistory = ({
    accountKey,
    blockHeights,
    hasMoreTransactions = true,
}: MockAccountHistoryParams): AssetAccountHistory => ({
    accountKey,
    transactions: blockHeights.map(blockHeight =>
        mockTransaction({ txid: `${accountKey}-${blockHeight}`, blockHeight }),
    ),
    hasMoreTransactions,
});

const getTxids = (accountHistories: AssetAccountHistory[]) =>
    mergeAssetTransactions(accountHistories).transactions.map(
        ({ transaction }) => transaction.txid,
    );

describe('mergeAssetTransactions', () => {
    it('merges the accounts newest first once no account has more', () => {
        expect(
            getTxids([
                mockAccountHistory({
                    accountKey: FIRST,
                    blockHeights: [90, 50],
                    hasMoreTransactions: false,
                }),
                mockAccountHistory({
                    accountKey: SECOND,
                    blockHeights: [70, 10],
                    hasMoreTransactions: false,
                }),
            ]),
        ).toEqual(['first-90', 'second-70', 'first-50', 'second-10']);
    });

    it('holds back what an account with more pages could still precede', () => {
        const merged = mergeAssetTransactions([
            mockAccountHistory({ accountKey: FIRST, blockHeights: [90, 80] }),
            mockAccountHistory({
                accountKey: SECOND,
                blockHeights: [95, 70, 20],
                hasMoreTransactions: false,
            }),
        ]);

        expect(merged.transactions.map(({ transaction }) => transaction.txid)).toEqual([
            'second-95',
            'first-90',
        ]);
        expect(merged.accountKeyToFetch).toBe(FIRST);
    });

    it('asks for the account whose oldest loaded transaction is the newest', () => {
        expect(
            mergeAssetTransactions([
                mockAccountHistory({ accountKey: FIRST, blockHeights: [90, 30] }),
                mockAccountHistory({ accountKey: SECOND, blockHeights: [95, 60] }),
            ]).accountKeyToFetch,
        ).toBe(SECOND);
    });

    it('shows nothing confirmed before an account with more has its first page', () => {
        const merged = mergeAssetTransactions([
            mockAccountHistory({
                accountKey: FIRST,
                blockHeights: [90],
                hasMoreTransactions: false,
            }),
            mockAccountHistory({ accountKey: SECOND, blockHeights: [] }),
        ]);

        expect(merged.transactions).toEqual([]);
        expect(merged.accountKeyToFetch).toBe(SECOND);
    });

    it('puts pending transactions first whatever is held back', () => {
        const pending = mockTransaction({ txid: 'pending' });

        const merged = mergeAssetTransactions([
            { accountKey: FIRST, transactions: [pending], hasMoreTransactions: false },
            mockAccountHistory({ accountKey: SECOND, blockHeights: [] }),
        ]);

        expect(merged.transactions).toEqual([{ accountKey: FIRST, transaction: pending }]);
    });

    it('holds back only what is older than the scanned window of an account with nothing in it', () => {
        const merged = mergeAssetTransactions([
            {
                accountKey: FIRST,
                transactions: [],
                hasMoreTransactions: true,
                loadedSinceBlockTime: NOON,
            },
            {
                accountKey: SECOND,
                transactions: [
                    mockTransaction({ txid: 'newer', blockHeight: 3, blockTime: NOON + 60 }),
                    mockTransaction({ txid: 'older', blockHeight: 2, blockTime: NOON - 60 }),
                ],
                hasMoreTransactions: false,
            },
        ]);

        expect(merged.transactions.map(({ transaction }) => transaction.txid)).toEqual(['newer']);
        expect(merged.accountKeyToFetch).toBe(FIRST);
    });

    it('pages a scanned window before stepping back past another one', () => {
        expect(
            mergeAssetTransactions([
                {
                    accountKey: FIRST,
                    transactions: [],
                    hasMoreTransactions: true,
                    loadedSinceBlockTime: NOON,
                },
                {
                    accountKey: SECOND,
                    transactions: [
                        mockTransaction({ txid: 'newest', blockHeight: 3, blockTime: NOON + 60 }),
                    ],
                    hasMoreTransactions: true,
                },
            ]).accountKeyToFetch,
        ).toBe(SECOND);
    });

    it('asks for nothing once no account has more', () => {
        expect(
            mergeAssetTransactions([
                mockAccountHistory({
                    accountKey: FIRST,
                    blockHeights: [90],
                    hasMoreTransactions: false,
                }),
            ]).accountKeyToFetch,
        ).toBe(undefined);
    });
});

describe('getAccountPaging', () => {
    const paging = {
        accountKey: FIRST,
        transactionCount: 0,
        loadedTransactionCount: 0,
        historyTotal: 60,
        areAllTransactionsLoaded: false,
        isFirstPageCached: false,
        fetchedPage: undefined,
        isExhausted: false,
        olderHistoryFrom: undefined,
        historyCoveredSince: undefined,
        perPage: 25,
    };

    it('asks for the first page until one is fetched', () => {
        expect(getAccountPaging(paging)).toEqual({
            nextPageRequest: { accountKey: FIRST, page: 1 },
            needsFirstPage: true,
            hasOlderHistory: false,
            hasMoreTransactions: true,
        });
    });

    it('continues after the full pages already cached', () => {
        expect(
            getAccountPaging({ ...paging, transactionCount: 30, isFirstPageCached: true })
                .nextPageRequest,
        ).toEqual({ accountKey: FIRST, page: 2 });
    });

    it('continues after the page it fetched itself', () => {
        expect(getAccountPaging({ ...paging, transactionCount: 50, fetchedPage: 2 })).toMatchObject(
            {
                nextPageRequest: { accountKey: FIRST, page: 3 },
                needsFirstPage: false,
                hasMoreTransactions: true,
            },
        );
    });

    it('has no more once the pages cover the account total', () => {
        expect(getAccountPaging({ ...paging, fetchedPage: 3 }).hasMoreTransactions).toBe(false);
    });

    it('has no more once all transactions are loaded', () => {
        expect(
            getAccountPaging({ ...paging, fetchedPage: 1, areAllTransactionsLoaded: true })
                .hasMoreTransactions,
        ).toBe(false);
    });

    it('has no more once an empty page ended the history', () => {
        expect(
            getAccountPaging({ ...paging, fetchedPage: 1, isExhausted: true }).hasMoreTransactions,
        ).toBe(false);
    });

    it('steps back past the scanned window once its pages are fetched', () => {
        expect(
            getAccountPaging({
                ...paging,
                transactionCount: 30,
                loadedTransactionCount: 30,
                historyTotal: 30,
                fetchedPage: 2,
                olderHistoryFrom: 1_000,
                historyCoveredSince: NOON,
            }),
        ).toEqual({
            nextPageRequest: { accountKey: FIRST, page: 2, from: 1_000 },
            needsFirstPage: false,
            hasOlderHistory: true,
            hasMoreTransactions: true,
            loadedSinceBlockTime: NOON,
        });
    });

    it('steps back even after an empty page ended the scanned window', () => {
        expect(
            getAccountPaging({
                ...paging,
                fetchedPage: 1,
                isExhausted: true,
                olderHistoryFrom: 1_000,
            }).hasOlderHistory,
        ).toBe(true);
    });

    it('keeps paging the scanned window before stepping back', () => {
        expect(
            getAccountPaging({
                ...paging,
                fetchedPage: 1,
                olderHistoryFrom: 1_000,
                historyCoveredSince: NOON,
            }),
        ).toEqual({
            nextPageRequest: { accountKey: FIRST, page: 2 },
            needsFirstPage: false,
            hasOlderHistory: false,
            hasMoreTransactions: true,
            loadedSinceBlockTime: undefined,
        });
    });

    it('does not step back before the first page', () => {
        expect(getAccountPaging({ ...paging, olderHistoryFrom: 1_000 }).hasOlderHistory).toBe(
            false,
        );
    });
});

describe('getAssetTokenTransfers', () => {
    it('keeps one row per transfer of the token', () => {
        const swap = mockTransaction({ txid: 'swap', blockHeight: 9, tokens: [USDC, DAI, USDC] });
        const other = mockTransaction({ txid: 'other', blockHeight: 8, tokens: [DAI] });

        const transfers = getAssetTokenTransfers(
            [
                { accountKey: FIRST, transaction: swap },
                { accountKey: SECOND, transaction: other },
            ],
            USDC,
        );

        expect(
            transfers.map(({ accountKey, tokenTransfer }) => [accountKey, tokenTransfer]),
        ).toEqual([
            [FIRST, swap.tokens[0]],
            [FIRST, swap.tokens[2]],
        ]);
    });
});

describe('takeWholeTransactions', () => {
    const swap = mockTransaction({ txid: 'swap', blockHeight: 2 });
    const rows = [
        { accountKey: FIRST, transaction: mockTransaction({ txid: 'newest', blockHeight: 3 }) },
        { accountKey: FIRST, transaction: swap },
        { accountKey: FIRST, transaction: swap },
        { accountKey: FIRST, transaction: mockTransaction({ txid: 'oldest', blockHeight: 1 }) },
    ];

    it('takes the rest of the last transaction rather than splitting it', () => {
        expect(takeWholeTransactions(rows, 2)).toEqual(rows.slice(0, 3));
    });

    it('takes all rows when fewer than asked for', () => {
        expect(takeWholeTransactions(rows, 10)).toBe(rows);
    });
});

describe('groupAssetTransactionsByDay', () => {
    it('heads each day and the pending transactions with their key', () => {
        const pending = { accountKey: FIRST, transaction: mockTransaction({ txid: 'pending' }) };
        const today = {
            accountKey: SECOND,
            transaction: mockTransaction({ txid: 'today', blockHeight: 3 }),
        };
        const alsoToday = {
            accountKey: FIRST,
            transaction: mockTransaction({ txid: 'alsoToday', blockHeight: 2 }),
        };
        const yesterday = {
            accountKey: FIRST,
            transaction: mockTransaction({
                txid: 'yesterday',
                blockHeight: 1,
                blockTime: NOON - DAY,
            }),
        };

        const items = groupAssetTransactionsByDay([pending, today, alsoToday, yesterday]);

        expect(items).toEqual([
            'pending',
            { ...pending, isFirstOfDay: true, isLastOfDay: true },
            expect.any(String),
            { ...today, isFirstOfDay: true, isLastOfDay: false },
            { ...alsoToday, isFirstOfDay: false, isLastOfDay: true },
            expect.any(String),
            { ...yesterday, isFirstOfDay: true, isLastOfDay: true },
        ]);
        expect(items[2]).not.toBe(items[5]);
    });
});
