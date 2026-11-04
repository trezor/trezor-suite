import { type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { deviceInitialState } from '@suite-common/device';
import {
    mockStakingPosition,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    blockchainInitialState,
    feesInitialState,
    fetchAndUpdateAccountThunk,
    initialWalletSettingsState,
    stellarContractTokensInitialState,
    transactionsActions,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    STAKING_CONFIRMATION_TRACKING_TIMEOUT_MS,
    type TrackStakingStepConfirmationThunkDeps,
    type TrackStakingStepConfirmationThunkState,
    trackStakingStepConfirmationThunk,
} from './trackStakingStepConfirmationThunk';
import {
    mockStakingProductRepository,
    mockStakingQueryClient,
    mockStakingServices,
    mockStakingSession,
    mockStakingSessionStep,
    mockStakingState,
} from '../../mocks';
import { type StakingMiddlewareDeps, prepareStakingMiddleware } from '../state/stakingMiddleware';
import { stakingActions, stakingReducer } from '../state/stakingReducer';
import { selectStakingPositionsByAccount } from '../state/stakingSelectors';
import { selectStakingSession } from '../state/stakingSessionSelectors';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAndUpdateAccountThunk: jest.fn(() => () => Promise.resolve()),
}));

const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const session = mockStakingSession({
    accountKey: account.key,
    steps: [{ ...mockStakingSessionStep(), status: 'awaiting', txid: 'tx1' }],
});
const { key: sessionKey } = session;
const params = { sessionKey, stepId: 'stake' };
const position = mockStakingPosition();
const POLL_INTERVAL_MS = 3_000;

const createTransaction = (
    overrides: Partial<WalletAccountTransaction> = {},
): WalletAccountTransaction => ({
    type: 'sent',
    txid: 'tx1',
    amount: '1000000000000000000',
    fee: '462000000000000',
    blockHeight: 100,
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
    descriptor: account.descriptor,
    deviceState: account.deviceState,
    symbol: account.symbol,
    ...overrides,
});

type State = TrackStakingStepConfirmationThunkState;
type Extra = TrackStakingStepConfirmationThunkDeps & StakingMiddlewareDeps;

const transactionsReducer = (
    state: State['wallet']['transactions'] = transactionsInitialState,
    action: UnknownAction,
): State['wallet']['transactions'] =>
    transactionsActions.addTransaction.match(action)
        ? {
              ...state,
              transactions: {
                  ...state.transactions,
                  [action.payload.account.key]: action.payload.transactions,
              },
          }
        : state;

const initStore = (storedTransactions: WalletAccountTransaction[] = []) => {
    const adapter = mockStakingProductAdapter({
        descriptor: eth,
        getPosition: mock(() => position),
    });
    const queryClient = mockStakingQueryClient();
    let getExtra: () => Extra = () => {
        throw new Error('Services are not composed yet');
    };
    const root = createTestCompositionRoot<Extra, State>({
        services: () => {
            const services: Extra['services'] = {
                staking: mockStakingServices({
                    stakingProductRepository: mockStakingProductRepository({
                        get: mock(() => adapter),
                        listBySymbol: mock(() => [adapter]),
                        isSupportedSymbol: mock(() => true),
                    }),
                }),
                queryClient,
                analytics: mockAnalytics<AnalyticsSharedEvents>(),
                getTradedAccountKeys: mockGetTradedAccountKeys(),
            };

            getExtra = () => ({ services });

            return services;
        },
        middleware: [prepareStakingMiddleware(() => getExtra())],
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            wallet: combineReducers({
                accounts: (state = [account]) => state,
                blockchain: (state = blockchainInitialState) => state,
                stellarContractTokens: (state = stellarContractTokensInitialState) => state,
                transactions: transactionsReducer,
                settings: (state = initialWalletSettingsState) => state,
                fees: (state = feesInitialState) => state,
            }),
            device: (state = deviceInitialState) => state,
            notifications: (state = []) => state,
            tokenDefinitions: (state = {}) => state,
        },
        preloadedState: {
            earn: { staking: mockStakingState({ descriptors: [eth], sessions: [session] }) },
            wallet: {
                transactions: {
                    ...transactionsInitialState,
                    transactions: { [account.key]: storedTransactions },
                },
            },
        },
    });

    return { store: root.services.store, adapter };
};

type Store = ReturnType<typeof initStore>['store'];

const getStep = (store: Store) => selectStakingSession(store.getState(), sessionKey)?.steps[0];

const fetchAndUpdateAccountThunkMock = fetchAndUpdateAccountThunk as unknown as jest.Mock;

const mockRefreshes = (store: () => Store, batches: (WalletAccountTransaction[] | null)[]) => {
    batches.forEach(batch => {
        fetchAndUpdateAccountThunkMock.mockImplementationOnce(() => () => {
            if (batch !== null) {
                store().dispatch(
                    transactionsActions.addTransaction({ account, transactions: batch }),
                );
            }

            return Promise.resolve();
        });
    });
};

describe('trackStakingStepConfirmationThunk', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        fetchAndUpdateAccountThunkMock.mockReset();
        fetchAndUpdateAccountThunkMock.mockImplementation(() => () => Promise.resolve());
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('settles a step whose transaction is already stored without a refresh', async () => {
        const { store, adapter } = initStore([createTransaction()]);

        await store.dispatch(trackStakingStepConfirmationThunk(params));

        expect(getStep(store)).toMatchObject({ status: 'done', txid: 'tx1' });
        expect(fetchAndUpdateAccountThunk).not.toHaveBeenCalled();
        expect(adapter.getPosition).toHaveBeenCalled();
        expect(selectStakingPositionsByAccount(store.getState(), account.key)).toEqual([position]);
    });

    it('confirms the step once a refresh brings the mined transaction', async () => {
        let store: Store | null = null;

        mockRefreshes(() => store!, [[createTransaction()]]);
        store = initStore().store;

        await store.dispatch(trackStakingStepConfirmationThunk(params));

        expect(getStep(store)).toMatchObject({ status: 'done', txid: 'tx1' });
        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledTimes(1);
    });

    it('fails the step when the chain rejected the transaction', async () => {
        let store: Store | null = null;

        mockRefreshes(() => store!, [[createTransaction({ type: 'failed' })]]);
        store = initStore().store;

        await store.dispatch(trackStakingStepConfirmationThunk(params));

        expect(getStep(store)).toMatchObject({
            status: 'failed',
            txid: 'tx1',
            error: { kind: 'confirmation-failed', code: null },
        });
    });

    it('polls at the block interval until the transaction arrives', async () => {
        let store: Store | null = null;

        mockRefreshes(
            () => store!,
            [null, [createTransaction({ blockHeight: undefined })], [createTransaction()]],
        );
        store = initStore().store;

        const tracking = store.dispatch(trackStakingStepConfirmationThunk(params));

        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS - 1);
        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledTimes(1);
        expect(getStep(store)?.status).toBe('awaiting');

        await jest.advanceTimersByTimeAsync(1);
        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledTimes(2);
        expect(getStep(store)?.status).toBe('awaiting');

        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
        await tracking;

        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledTimes(3);
        expect(getStep(store)).toMatchObject({ status: 'done', txid: 'tx1' });
    });

    it('stops when the step is no longer awaiting', async () => {
        let store: Store | null = null;

        mockRefreshes(() => store!, [null, null]);
        store = initStore().store;

        const tracking = store.dispatch(trackStakingStepConfirmationThunk(params));

        await jest.advanceTimersByTimeAsync(0);
        store.dispatch(stakingActions.sessionDiscarded({ sessionKey }));
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
        await tracking;

        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledTimes(1);
    });

    it('ends its last wait at the deadline instead of a full poll interval later', async () => {
        let isSettled = false;

        fetchAndUpdateAccountThunkMock.mockImplementationOnce(() => () => {
            jest.setSystemTime(Date.now() + STAKING_CONFIRMATION_TRACKING_TIMEOUT_MS - 1_000);

            return Promise.resolve();
        });

        const { store } = initStore();
        const tracking = store.dispatch(trackStakingStepConfirmationThunk(params)).then(() => {
            isSettled = true;
        });

        await jest.advanceTimersByTimeAsync(1_000);

        expect(isSettled).toBe(true);
        await tracking;
        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledTimes(1);
    });

    it('gives up after the deadline and leaves the step awaiting', async () => {
        let store: Store | null = null;

        mockRefreshes(() => store!, [null, null]);
        store = initStore().store;

        const tracking = store.dispatch(trackStakingStepConfirmationThunk(params));

        await jest.advanceTimersByTimeAsync(0);
        jest.setSystemTime(Date.now() + STAKING_CONFIRMATION_TRACKING_TIMEOUT_MS);
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
        await tracking;

        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledTimes(1);
        expect(getStep(store)).toMatchObject({ status: 'awaiting', txid: 'tx1' });
    });
});
