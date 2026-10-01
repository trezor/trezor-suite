import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import {
    type ConfirmTronPendingTransactionThunkDeps,
    type ConfirmTronPendingTransactionThunkState,
    confirmTronPendingTransactionThunk,
} from './confirmPendingTransactionThunk';
import { selectAccountRefreshTime } from '../../../accounts/accountsRefreshTimeReducer';
import { fetchAndUpdateAccountThunk } from '../../../accounts/accountsThunks';
import { tronStakeActions } from '../tronStakingReducer';

jest.mock('../../../accounts/accountsThunks', () => ({ fetchAndUpdateAccountThunk: jest.fn() }));
jest.mock('../../../accounts/accountsRefreshTimeReducer', () => ({
    ...jest.requireActual('../../../accounts/accountsRefreshTimeReducer'),
    selectAccountRefreshTime: jest.fn(),
}));

const ACCOUNT_KEY = 'tron-account' as AccountKey;
const FLOW = 'stake' as const;
const TXID = 'a'.repeat(64);
const REFRESH_TIME_BEFORE_CONFIRMATION = 1_000;

const fetchAndUpdateAccountThunkMock = fetchAndUpdateAccountThunk as unknown as jest.Mock;
const selectAccountRefreshTimeMock = jest.mocked(selectAccountRefreshTime);

type Store = TestCompositionStore<
    ConfirmTronPendingTransactionThunkState,
    ConfirmTronPendingTransactionThunkDeps
>;

const initStore = (): Store =>
    createTestCompositionRoot<
        ConfirmTronPendingTransactionThunkDeps,
        ConfirmTronPendingTransactionThunkState
    >({
        preloadedState: {},
        services: () => ({
            analytics: mockAnalytics<AnalyticsSharedEvents>(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
        }),
    }).services.store;

const mockRefreshOutcomes = (outcomes: ('refreshed' | 'failed')[]) => {
    let refreshTime = REFRESH_TIME_BEFORE_CONFIRMATION;

    selectAccountRefreshTimeMock.mockImplementation(() => refreshTime);
    outcomes.forEach(outcome => {
        fetchAndUpdateAccountThunkMock.mockImplementationOnce(() => () => {
            if (outcome === 'refreshed') {
                refreshTime += 1;
            }

            return Promise.resolve();
        });
    });
};

const confirmPendingTransaction = (store: Store) =>
    store.dispatch(
        confirmTronPendingTransactionThunk({
            accountKey: ACCOUNT_KEY,
            flow: FLOW,
            txid: TXID,
            retryDelayMs: 0,
        }),
    );

const getConfirmedActions = (store: Store) =>
    store.getActions().filter(tronStakeActions.pendingTransactionConfirmed.match);

beforeEach(() => {
    jest.clearAllMocks();
});

describe('confirmTronPendingTransactionThunk', () => {
    it('confirms the transaction once the account has been refreshed', async () => {
        mockRefreshOutcomes(['refreshed']);
        const store = initStore();

        await confirmPendingTransaction(store);

        expect(fetchAndUpdateAccountThunkMock).toHaveBeenCalledTimes(1);
        expect(getConfirmedActions(store)).toEqual([
            tronStakeActions.pendingTransactionConfirmed({
                accountKey: ACCOUNT_KEY,
                flow: FLOW,
                txid: TXID,
            }),
        ]);
    });

    it('retries a failed refresh before confirming', async () => {
        mockRefreshOutcomes(['failed', 'failed', 'refreshed']);
        const store = initStore();

        await confirmPendingTransaction(store);

        expect(fetchAndUpdateAccountThunkMock).toHaveBeenCalledTimes(3);
        expect(getConfirmedActions(store)).toHaveLength(1);
    });

    it('confirms anyway after the refresh keeps failing', async () => {
        mockRefreshOutcomes(['failed', 'failed', 'failed', 'failed', 'failed']);
        const store = initStore();

        await confirmPendingTransaction(store);

        expect(fetchAndUpdateAccountThunkMock).toHaveBeenCalledTimes(4);
        expect(getConfirmedActions(store)).toHaveLength(1);
    });
});
