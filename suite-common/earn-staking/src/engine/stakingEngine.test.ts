import { type Middleware, type UnknownAction, combineReducers, isAction } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents, events } from '@suite-common/analytics';
import { deviceInitialState } from '@suite-common/device';
import {
    STAKING_SIGNING_ERROR_CODES,
    StakingAdapterError,
    type StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import {
    mockComposedStakingStep,
    mockStakingPlan,
    mockStakingPosition,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    blockchainInitialState,
    feesInitialState,
    fetchAndUpdateAccountThunk,
    handleEarnTransactionReplacementThunk,
    initialWalletSettingsState,
    stellarContractTokensInitialState,
    transactionsActions,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import type {
    PrecomposedTransactionFinalBumpFeeRbf,
    PrecomposedTransactionFinalCancelRbf,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type BroadcastStakingStepThunkDeps,
    type BroadcastStakingStepThunkState,
    broadcastStakingStepThunk,
} from './broadcastStakingStepThunk';
import { cancelStakingStepThunk } from './cancelStakingStepThunk';
import { composeStakingStepThunk } from './composeStakingStepThunk';
import { discardStakingSessionThunk } from './discardStakingSessionThunk';
import { planStakingOperationThunk } from './planStakingOperationThunk';
import { signStakingStepThunk } from './signStakingStepThunk';
import {
    mockStakingDeviceAccess,
    mockStakingProductRepository,
    mockStakingQueryClient,
    mockStakingServices,
    mockStakingState,
} from '../../mocks';
import type { StakingDeviceAccess } from '../createStakingDeviceAccess';
import { type StakingMiddlewareDeps, prepareStakingMiddleware } from '../state/stakingMiddleware';
import { stakingReducer } from '../state/stakingReducer';
import { selectStakingPositionsByAccount } from '../state/stakingSelectors';
import { getStakingSessionKey } from '../state/stakingSessionKey';
import {
    selectIsStakingSessionActive,
    selectStakingCurrentStep,
    selectStakingReview,
    selectStakingSession,
} from '../state/stakingSessionSelectors';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAndUpdateAccountThunk: jest.fn(() => () => Promise.resolve()),
}));

const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const position = mockStakingPosition();
const plan = mockStakingPlan({
    steps: [
        mockStakingStep({ id: 'freeze', kind: 'freeze', awaitConfirmation: true }),
        mockStakingStep({ id: 'vote', kind: 'vote' }),
    ],
});
const sessionKey = getStakingSessionKey({
    accountKey: account.key,
    productId: eth.id,
    operation: 'stake',
});
const planParams = {
    accountKey: account.key,
    productId: eth.id,
    operation: 'stake' as const,
    amount: plan.amount,
    options: {},
};
const SOLANA_VALIDITY_MS = 24_000;
const POLL_INTERVAL_MS = 3_000;

type State = BroadcastStakingStepThunkState;
type Extra = BroadcastStakingStepThunkDeps & StakingMiddlewareDeps;

const createTransaction = (
    overrides: Partial<WalletAccountTransaction> = {},
): WalletAccountTransaction => ({
    type: 'sent',
    txid: 'tx-freeze',
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

const rbfBase = {
    type: 'final' as const,
    totalSpent: '1000500000000000000',
    fee: '500000000000000',
    feePerByte: '2.5',
    bytes: 0,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
    prevTxid: 'tx-freeze',
};
const bumpFee: PrecomposedTransactionFinalBumpFeeRbf = {
    ...rbfBase,
    rbfType: 'bump-fee',
    feeDifference: '38000000000000',
    useNativeRbf: false,
};
const cancelRbf: PrecomposedTransactionFinalCancelRbf = { ...rbfBase, rbfType: 'cancel' };

type AdapterOverrides = Partial<StakingProductAdapter>;

const createAdapter = (overrides: AdapterOverrides = {}) =>
    mockStakingProductAdapter({
        descriptor: eth,
        getPosition: mock(() => position),
        planOperation: mock(() => Promise.resolve(plan)),
        composeStep: mock(({ step }) =>
            Promise.resolve(mockComposedStakingStep({ unsignedTx: { step: step.id } })),
        ),
        signStep: mock(({ step }) => Promise.resolve({ serializedTx: `signed-${step.id}` })),
        broadcastStep: mock(({ step }) => Promise.resolve({ txid: `tx-${step.id}` })),
        ...overrides,
    });

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

type InitStoreParams = {
    adapter?: AdapterOverrides;
    deviceAccess?: StakingDeviceAccess;
};

const initStore = ({
    adapter: adapterOverrides = {},
    deviceAccess = mockStakingDeviceAccess(),
}: InitStoreParams = {}) => {
    const adapter = createAdapter(adapterOverrides);
    const analytics = mockAnalytics<AnalyticsSharedEvents>();
    const actions: UnknownAction[] = [];
    const recorder: Middleware = () => next => action => {
        if (isAction(action)) actions.push(action);

        return next(action);
    };
    let getExtra: () => Extra = () => {
        throw new Error('Services are not composed yet');
    };
    const root = createTestCompositionRoot<Extra, State>({
        services: () => {
            const services: Extra['services'] = {
                staking: mockStakingServices({
                    stakingProductRepository: mockStakingProductRepository({
                        get: mock(() => adapter),
                        list: mock(() => [adapter]),
                        listBySymbol: mock(() => [adapter]),
                        isSupportedSymbol: mock(() => true),
                    }),
                    deviceAccess,
                }),
                queryClient: mockStakingQueryClient(),
                analytics,
                getTradedAccountKeys: mockGetTradedAccountKeys(),
            };

            getExtra = () => ({ services });

            return services;
        },
        middleware: [recorder, prepareStakingMiddleware(() => getExtra())],
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
        preloadedState: { earn: { staking: mockStakingState({ descriptors: [eth] }) } },
    });
    const { store } = root.services;

    return { store, adapter, analytics, actions };
};

type Store = ReturnType<typeof initStore>['store'];

const getStep = (store: Store, stepId: string) =>
    selectStakingSession(store.getState(), sessionKey)?.steps.find(step => step.id === stepId);

const planStake = (store: Store) => store.dispatch(planStakingOperationThunk(planParams)).unwrap();

const compose = (store: Store) => store.dispatch(composeStakingStepThunk({ sessionKey })).unwrap();

const sign = (store: Store) =>
    store.dispatch(signStakingStepThunk({ sessionKey, feeLevel: 'normal' })).unwrap();

const broadcast = (store: Store) =>
    store.dispatch(broadcastStakingStepThunk({ sessionKey })).unwrap();

const runStep = async (store: Store) => {
    await compose(store);
    await sign(store);

    return broadcast(store);
};

const mine = (store: Store, transaction: WalletAccountTransaction) =>
    store.dispatch(transactionsActions.addTransaction({ account, transactions: [transaction] }));

const replace = (
    store: Store,
    precomposedTransaction:
        PrecomposedTransactionFinalBumpFeeRbf | PrecomposedTransactionFinalCancelRbf,
    txid: string,
) =>
    store.dispatch(
        handleEarnTransactionReplacementThunk.pending('request', {
            account,
            precomposedTransaction,
            txid,
        }),
    );

const settleTracking = () => jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

const broadcastStatuses = (actions: UnknownAction[]) =>
    actions
        .filter(transactionsActions.transactionBroadcastStatus.match)
        .map(action => action.payload);

describe('staking engine', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.mocked(fetchAndUpdateAccountThunk).mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('runs a two-step plan: the second step waits for the first to confirm', async () => {
        const { store, adapter, actions } = initStore();

        expect(await planStake(store)).toBe(sessionKey);
        expect(selectStakingCurrentStep(store.getState(), sessionKey)?.id).toBe('freeze');

        await compose(store);
        await sign(store);

        expect(selectStakingReview(store.getState())).toMatchObject({
            session: { key: sessionKey },
            step: { id: 'freeze', status: 'signed' },
        });

        expect(await broadcast(store)).toEqual({ txid: 'tx-freeze' });
        expect(getStep(store, 'freeze')).toMatchObject({ status: 'awaiting', txid: 'tx-freeze' });
        expect(selectStakingReview(store.getState())).toBeNull();
        expect(selectIsStakingSessionActive(store.getState(), sessionKey)).toBe(true);
        expect(selectStakingCurrentStep(store.getState(), sessionKey)?.id).toBe('freeze');
        expect((await store.dispatch(planStakingOperationThunk(planParams))).payload).toBe(
            'session-active',
        );
        expect((await store.dispatch(composeStakingStepThunk({ sessionKey }))).payload).toBe(
            'step-not-ready',
        );

        mine(store, createTransaction());
        await settleTracking();

        expect(getStep(store, 'freeze')).toMatchObject({ status: 'done', txid: 'tx-freeze' });
        expect(selectStakingCurrentStep(store.getState(), sessionKey)?.id).toBe('vote');
        expect(selectStakingPositionsByAccount(store.getState(), account.key)).toEqual([position]);

        expect(await runStep(store)).toEqual({ txid: 'tx-vote' });

        expect(getStep(store, 'vote')).toMatchObject({ status: 'done', txid: 'tx-vote' });
        expect(selectStakingCurrentStep(store.getState(), sessionKey)).toBeNull();
        expect(selectIsStakingSessionActive(store.getState(), sessionKey)).toBe(false);
        expect(adapter.signStep).toHaveBeenCalledTimes(2);
        expect(broadcastStatuses(actions).map(status => status.status)).toEqual([
            'success',
            'success',
        ]);
        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledWith({ accountKey: account.key });

        await store.dispatch(discardStakingSessionThunk({ sessionKey })).unwrap();

        expect(selectStakingSession(store.getState(), sessionKey)).toBeNull();
    });

    it('follows a fee bump and confirms the step under the new txid', async () => {
        const { store } = initStore();

        await planStake(store);
        await runStep(store);

        replace(store, bumpFee, 'tx-freeze-bumped');
        expect(getStep(store, 'freeze')).toMatchObject({
            status: 'awaiting',
            txid: 'tx-freeze-bumped',
        });

        mine(store, createTransaction({ txid: 'tx-freeze' }));
        expect(getStep(store, 'freeze')?.status).toBe('awaiting');

        mine(store, createTransaction({ txid: 'tx-freeze-bumped' }));
        await settleTracking();

        expect(getStep(store, 'freeze')).toMatchObject({
            status: 'done',
            txid: 'tx-freeze-bumped',
        });
    });

    it('fails the step when the chain rejects the transaction, and the session can be discarded', async () => {
        const { store } = initStore();

        await planStake(store);
        await runStep(store);
        mine(store, createTransaction({ type: 'failed' }));
        await settleTracking();

        expect(getStep(store, 'freeze')).toMatchObject({
            status: 'failed',
            error: { kind: 'confirmation-failed', code: null },
        });
        expect(selectStakingCurrentStep(store.getState(), sessionKey)?.id).toBe('freeze');
        expect((await store.dispatch(composeStakingStepThunk({ sessionKey }))).payload).toBe(
            'step-not-ready',
        );

        await store.dispatch(discardStakingSessionThunk({ sessionKey })).unwrap();

        expect(selectStakingSession(store.getState(), sessionKey)).toBeNull();
    });

    it('fails the step when its transaction is replaced by a cancel', async () => {
        const { store } = initStore();

        await planStake(store);
        await runStep(store);
        replace(store, cancelRbf, 'tx-freeze-cancelled');
        await settleTracking();

        expect(getStep(store, 'freeze')).toMatchObject({
            status: 'failed',
            txid: 'tx-freeze',
            error: { kind: 'replaced', code: null },
        });
    });

    it('returns a declined review to composed and signs again', async () => {
        const { store, adapter, analytics } = initStore();

        await planStake(store);
        await compose(store);
        await sign(store);
        await store.dispatch(cancelStakingStepThunk({ sessionKey })).unwrap();

        expect(getStep(store, 'freeze')).toMatchObject({ status: 'composed', error: null });
        expect(selectStakingReview(store.getState())).toBeNull();
        expect(analytics.report).toHaveBeenCalledWith({
            type: events.transactionCancelEvent.name,
            payload: { txType: 'stake', networkSymbol: 'eth', stage: 'review' },
        });

        await sign(store);

        expect(getStep(store, 'freeze')?.status).toBe('signed');
        expect(adapter.signStep).toHaveBeenCalledTimes(2);
    });

    it('returns a device rejection to composed without a second signature', async () => {
        const { store, adapter, analytics } = initStore({
            adapter: {
                signStep: mock(() =>
                    Promise.reject(new StakingAdapterError(STAKING_SIGNING_ERROR_CODES.cancelled)),
                ),
            },
        });

        await planStake(store);
        await compose(store);

        expect(
            (await store.dispatch(signStakingStepThunk({ sessionKey, feeLevel: 'normal' })))
                .payload,
        ).toBe('cancelled');
        expect(getStep(store, 'freeze')).toMatchObject({ status: 'composed', error: null });
        expect(analytics.report).toHaveBeenCalledWith({
            type: events.transactionCancelEvent.name,
            payload: { txType: 'stake', networkSymbol: 'eth', stage: 'signing' },
        });
        expect(adapter.broadcastStep).not.toHaveBeenCalled();
    });

    it('returns an expired signature to composed and broadcasts a fresh one', async () => {
        const { store, adapter } = initStore({
            adapter: {
                composeStep: mock(() =>
                    Promise.resolve(mockComposedStakingStep({ validityMs: SOLANA_VALIDITY_MS })),
                ),
            },
        });

        await planStake(store);
        await compose(store);
        await sign(store);
        jest.setSystemTime(Date.now() + SOLANA_VALIDITY_MS + 1);

        expect((await store.dispatch(broadcastStakingStepThunk({ sessionKey }))).payload).toBe(
            'step-expired',
        );
        expect(getStep(store, 'freeze')).toMatchObject({
            status: 'composed',
            error: { kind: 'expired', code: null },
        });
        expect(adapter.broadcastStep).not.toHaveBeenCalled();

        await sign(store);

        expect(await broadcast(store)).toEqual({ txid: 'tx-freeze' });
        expect(adapter.signStep).toHaveBeenCalledTimes(2);
    });

    it('lets an awaiting session be discarded and planned again', async () => {
        const { store } = initStore();

        await planStake(store);
        await runStep(store);
        await store.dispatch(discardStakingSessionThunk({ sessionKey })).unwrap();
        await settleTracking();

        expect(selectStakingSession(store.getState(), sessionKey)).toBeNull();
        expect(await planStake(store)).toBe(sessionKey);
        expect(getStep(store, 'freeze')?.status).toBe('pending');
    });

    it('drops a compose result when the session was planned again meanwhile', async () => {
        let store: Store | null = null;
        const started = initStore({
            adapter: {
                composeStep: mock(async ({ step }) => {
                    await store?.dispatch(planStakingOperationThunk(planParams)).unwrap();

                    return mockComposedStakingStep({ unsignedTx: { step: step.id } });
                }),
            },
        });

        store = started.store;

        await planStake(store);

        expect((await store.dispatch(composeStakingStepThunk({ sessionKey }))).payload).toBe(
            'session-replaced',
        );
        expect(getStep(store, 'freeze')).toMatchObject({ status: 'pending', error: null });
    });

    it('refuses to replace or discard a session while the device is signing', async () => {
        let releaseDevice = () => {};
        const { store } = initStore({
            adapter: {
                signStep: mock<StakingProductAdapter['signStep']>(
                    () =>
                        new Promise(resolve => {
                            releaseDevice = () => resolve({ serializedTx: 'signed-freeze' });
                        }),
                ),
            },
        });

        await planStake(store);
        await compose(store);

        const signing = store.dispatch(signStakingStepThunk({ sessionKey, feeLevel: 'normal' }));

        await jest.advanceTimersByTimeAsync(0);

        expect(getStep(store, 'freeze')?.status).toBe('signing');
        expect(selectStakingReview(store.getState())?.step.status).toBe('signing');
        expect((await store.dispatch(planStakingOperationThunk(planParams))).payload).toBe(
            'session-active',
        );
        expect((await store.dispatch(discardStakingSessionThunk({ sessionKey }))).payload).toBe(
            'step-in-flight',
        );

        releaseDevice();
        await signing;

        expect(getStep(store, 'freeze')?.status).toBe('signed');
    });

    it('signs every step through the injected device access', async () => {
        const deviceAccess = mockStakingDeviceAccess();
        const { store } = initStore({ deviceAccess });

        await planStake(store);
        await runStep(store);
        mine(store, createTransaction());
        await settleTracking();
        await runStep(store);

        expect(deviceAccess.run).toHaveBeenCalledTimes(2);
        expect(deviceAccess.cancel).not.toHaveBeenCalled();
    });
});
