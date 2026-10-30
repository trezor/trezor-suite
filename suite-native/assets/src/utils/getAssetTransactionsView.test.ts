import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import { type AccountHistory } from '../assetTransactionsSelectors';
import { getAssetTransactionsView } from './getAssetTransactionsView';

const FIRST = 'first' as AccountKey;
const SECOND = 'second' as AccountKey;

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

const PER_PAGE = 2;
const NOON = 1_700_049_600;
const DAY = 24 * 60 * 60;

type MockTransactionParams = {
    accountKey: AccountKey;
    blockHeight: number;
    tokens?: TokenAddress[];
};

const mockTransaction = ({ accountKey, blockHeight, tokens = [] }: MockTransactionParams) =>
    ({
        txid: `${accountKey}-${blockHeight}`,
        blockHeight,
        blockTime: NOON,
        tokens: tokens.map(contract => ({ contract, amount: '1' })),
    }) as unknown as WalletAccountTransaction;

type MockAccountHistoryParams = Partial<AccountHistory> & {
    accountKey: AccountKey;
    blockHeights?: number[];
    tokens?: TokenAddress[];
};

const mockAccountHistory = ({
    accountKey,
    blockHeights = [],
    tokens,
    ...accountHistory
}: MockAccountHistoryParams): AccountHistory => ({
    accountKey,
    isAssetAccount: true,
    transactions: blockHeights.map(blockHeight =>
        mockTransaction({ accountKey, blockHeight, tokens }),
    ),
    transactionSlotCount: blockHeights.length,
    historyTotal: 10,
    areAllTransactionsLoaded: false,
    isFirstPageCached: false,
    olderHistoryFrom: undefined,
    historyCoveredSince: undefined,
    ...accountHistory,
});

type GetViewParams = {
    accountHistories: AccountHistory[];
    fetchedPageByAccount?: Partial<Record<AccountKey, number>>;
    failedAccountKeys?: AccountKey[];
    tokenContract?: TokenAddress;
};

const getView = ({
    accountHistories,
    fetchedPageByAccount = {},
    failedAccountKeys = [],
    tokenContract,
}: GetViewParams) =>
    getAssetTransactionsView({
        accountHistories,
        fetchedPageByAccount,
        exhaustedAccountKeys: new Set(),
        failedAccountKeys: new Set(failedAccountKeys),
        visibleCount: PER_PAGE,
        tokenContract,
        perPage: PER_PAGE,
    });

const getTxids = (items: ReturnType<typeof getView>['items']) =>
    items.flatMap(item => (typeof item === 'string' ? [] : [item.transaction.txid]));

describe('getAssetTransactionsView', () => {
    it('asks for the first page of every account at once', () => {
        const view = getView({
            accountHistories: [
                mockAccountHistory({ accountKey: FIRST }),
                mockAccountHistory({ accountKey: SECOND }),
            ],
        });

        expect(view.automaticPageRequests).toEqual([
            { accountKey: FIRST, page: 1 },
            { accountKey: SECOND, page: 1 },
        ]);
        expect(view.items).toEqual([]);
    });

    it('does not ask again for a first page that failed', () => {
        const view = getView({
            accountHistories: [
                mockAccountHistory({ accountKey: FIRST }),
                mockAccountHistory({ accountKey: SECOND }),
            ],
            failedAccountKeys: [SECOND],
        });

        expect(view.automaticPageRequests).toEqual([{ accountKey: FIRST, page: 1 }]);
    });

    it('asks for the next page of the account holding back rows until a page of rows is shown', () => {
        const view = getView({
            accountHistories: [
                mockAccountHistory({ accountKey: FIRST, blockHeights: [90, 80] }),
                mockAccountHistory({
                    accountKey: SECOND,
                    blockHeights: [70],
                    areAllTransactionsLoaded: true,
                }),
            ],
            fetchedPageByAccount: { [FIRST]: 1, [SECOND]: 1 },
        });

        expect(getTxids(view.items)).toEqual(['first-90']);
        expect(view.automaticPageRequests).toEqual([{ accountKey: FIRST, page: 2 }]);
    });

    it('asks for nothing more once a page of rows is shown', () => {
        const view = getView({
            accountHistories: [
                mockAccountHistory({ accountKey: FIRST, blockHeights: [90, 85, 80] }),
            ],
            fetchedPageByAccount: { [FIRST]: 1 },
        });

        expect(getTxids(view.items)).toEqual(['first-90', 'first-85']);
        expect(view.automaticPageRequests).toEqual([]);
        expect(view.hasMoreTransactions).toBe(true);
    });

    it('holds back confirmed rows while a failed account may still precede them', () => {
        const view = getView({
            accountHistories: [
                mockAccountHistory({
                    accountKey: FIRST,
                    blockHeights: [90, 50],
                    areAllTransactionsLoaded: true,
                }),
                mockAccountHistory({ accountKey: SECOND }),
            ],
            fetchedPageByAccount: { [FIRST]: 1 },
            failedAccountKeys: [SECOND],
        });

        expect(view.items).toEqual([]);
        expect(view.automaticPageRequests).toEqual([]);
        expect(view.hasLoadingFailed).toBe(true);
        expect(view.isEmptyStateDeferred).toBe(true);
    });

    it('leaves the step back past the scanned window to the user', () => {
        const view = getView({
            accountHistories: [
                mockAccountHistory({
                    accountKey: FIRST,
                    blockHeights: [90, 80],
                    historyTotal: 2,
                    olderHistoryFrom: NOON - 2 * DAY,
                    historyCoveredSince: NOON - DAY,
                }),
            ],
            fetchedPageByAccount: { [FIRST]: 1 },
        });

        expect(view.needsOlderHistoryScan).toBe(true);
        expect(view.automaticPageRequests).toEqual([]);
        expect(view.olderHistoryPageRequest).toEqual({
            accountKey: FIRST,
            page: 2,
            from: NOON - 2 * DAY,
        });
    });

    it('shows only the transfers of the token from the accounts that may have them', () => {
        const view = getView({
            accountHistories: [
                mockAccountHistory({
                    accountKey: FIRST,
                    blockHeights: [90],
                    tokens: [USDC],
                    areAllTransactionsLoaded: true,
                }),
                mockAccountHistory({
                    accountKey: SECOND,
                    blockHeights: [95],
                    isAssetAccount: false,
                }),
            ],
            fetchedPageByAccount: { [FIRST]: 1, [SECOND]: 1 },
            tokenContract: USDC,
        });

        expect(getTxids(view.items)).toEqual(['first-90']);
    });
});
