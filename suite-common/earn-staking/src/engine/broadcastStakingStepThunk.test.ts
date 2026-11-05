import { type Middleware, type UnknownAction, combineReducers, isAction } from '@reduxjs/toolkit';

const attemptId = 'attempt-1';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { deviceInitialState } from '@suite-common/device';
import { StakingAdapterError, type StakingProductAdapter } from '@suite-common/earn-staking-common';
import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingPlan,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingStep,
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
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type BroadcastStakingStepThunkDeps,
    type BroadcastStakingStepThunkState,
    broadcastStakingStepThunk,
} from './broadcastStakingStepThunk';
import { trackStakingStepConfirmationThunk } from './trackStakingStepConfirmationThunk';
import {
    mockStakingProductRepository,
    mockStakingServices,
    mockStakingSession,
    mockStakingState,
} from '../../mocks';
import { type StakingState, stakingActions, stakingReducer } from '../state/stakingReducer';
import { selectStakingSession } from '../state/stakingSessionSelectors';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAndUpdateAccountThunk: jest.fn(() => () => Promise.resolve()),
}));
jest.mock('./trackStakingStepConfirmationThunk', () => ({
    trackStakingStepConfirmationThunk: jest.fn(() => () => Promise.resolve()),
}));

const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const awaitingPlan = mockStakingPlan({ steps: [mockStakingStep({ awaitConfirmation: true })] });
const session = mockStakingSession({ accountKey: account.key, plan: awaitingPlan });
const { key: sessionKey } = session;
const stake = { sessionKey, stepId: 'stake' };
const composed = mockComposedStakingStep();
const signed = mockSignedStakingStep();

type InitStoreParams = {
    broadcastStep?: StakingProductAdapter['broadcastStep'];
    staking?: StakingState;
    middleware?: Middleware[];
};

const signedState = (
    sessionToSign = session,
    composedStep = composed,
    signingStartedAt = Date.now(),
): StakingState =>
    [
        stakingActions.stepComposed({ ...stake, attemptId, composed: composedStep }),
        stakingActions.stepSigning({ ...stake, attemptId, feeLevel: 'normal', signingStartedAt }),
        stakingActions.stepSigned({ ...stake, attemptId, signed }),
    ].reduce(stakingReducer, mockStakingState({ descriptors: [eth], sessions: [sessionToSign] }));

const initStore = ({
    broadcastStep = mock(() => Promise.resolve({ txid: 'tx1' })),
    staking = signedState(),
    middleware = [],
}: InitStoreParams = {}) => {
    const adapter = mockStakingProductAdapter({ descriptor: eth, broadcastStep });
    const actions: UnknownAction[] = [];
    const recorder: Middleware = () => next => action => {
        if (isAction(action)) actions.push(action);

        return next(action);
    };
    const root = createTestCompositionRoot<
        BroadcastStakingStepThunkDeps,
        BroadcastStakingStepThunkState
    >({
        services: () => ({
            staking: mockStakingServices({
                stakingProductRepository: mockStakingProductRepository({
                    get: mock(() => adapter),
                }),
            }),
            analytics: mockAnalytics<AnalyticsSharedEvents>(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
        }),
        middleware: [recorder, ...middleware],
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            wallet: combineReducers({
                accounts: (state = [account]) => state,
                blockchain: (state = blockchainInitialState) => state,
                stellarContractTokens: (state = stellarContractTokensInitialState) => state,
                transactions: (state = transactionsInitialState) => state,
                settings: (state = initialWalletSettingsState) => state,
                fees: (state = feesInitialState) => state,
            }),
            device: (state = deviceInitialState) => state,
            notifications: (state = []) => state,
            tokenDefinitions: (state = {}) => state,
        },
        preloadedState: { earn: { staking } },
    });

    return { store: root.services.store, adapter, actions };
};

type Store = ReturnType<typeof initStore>['store'];

const getStep = (store: Store) => selectStakingSession(store.getState(), sessionKey)?.steps[0];

const broadcast = (store: Store) => store.dispatch(broadcastStakingStepThunk({ sessionKey }));

const broadcastStatuses = (actions: UnknownAction[]) =>
    actions
        .filter(transactionsActions.transactionBroadcastStatus.match)
        .map(action => action.payload);

describe('broadcastStakingStepThunk', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.mocked(fetchAndUpdateAccountThunk).mockClear();
        jest.mocked(trackStakingStepConfirmationThunk).mockClear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('broadcasts the signed step, notifies the earn bookkeeping and tracks the confirmation', async () => {
        const { store, adapter, actions } = initStore();
        const result = await broadcast(store);

        expect(broadcastStakingStepThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toEqual({ txid: 'tx1' });
        expect(adapter.broadcastStep).toHaveBeenCalledWith({
            account,
            plan: awaitingPlan,
            step: awaitingPlan.steps[0],
            signedStep: signed,
        });
        expect(getStep(store)).toMatchObject({ status: 'awaiting', txid: 'tx1', error: null });
        expect(broadcastStatuses(actions)).toEqual([
            expect.objectContaining({ account, txid: 'tx1', flow: 'stake', status: 'success' }),
        ]);
        expect(actions).toContainEqual(
            expect.objectContaining({
                payload: expect.objectContaining({ type: 'tx-staked', txid: 'tx1' }),
            }),
        );
        expect(trackStakingStepConfirmationThunk).toHaveBeenCalledWith({
            sessionKey,
            stepId: 'stake',
        });
        expect(fetchAndUpdateAccountThunk).not.toHaveBeenCalled();
    });

    it('completes a step that needs no confirmation and refreshes the account once', async () => {
        const plainSession = mockStakingSession({ accountKey: account.key });
        const { store } = initStore({ staking: signedState(plainSession) });

        await store.dispatch(broadcastStakingStepThunk({ sessionKey: plainSession.key }));

        expect(selectStakingSession(store.getState(), plainSession.key)?.steps[0]).toMatchObject({
            status: 'done',
            txid: 'tx1',
        });
        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledWith({ accountKey: account.key });
        expect(trackStakingStepConfirmationThunk).not.toHaveBeenCalled();
    });

    it('refuses an expired signature and returns the step to composed', async () => {
        const { store, adapter, actions } = initStore({
            staking: signedState(session, mockComposedStakingStep({ validityMs: 24_000 }), 1),
        });
        const result = await broadcast(store);

        expect(result.payload).toBe('step-expired');
        expect(adapter.broadcastStep).not.toHaveBeenCalled();
        expect(getStep(store)).toMatchObject({
            status: 'composed',
            error: { kind: 'expired', code: null },
        });
        expect(broadcastStatuses(actions)).toEqual([]);
        expect(fetchAndUpdateAccountThunk).not.toHaveBeenCalled();
    });

    it('rejects when the broadcasting dispatch was refused, without a push', async () => {
        const dropBroadcasting: Middleware = () => next => action =>
            stakingActions.stepBroadcasting.match(action) ? action : next(action);
        const { store, adapter } = initStore({ middleware: [dropBroadcasting] });

        const result = await broadcast(store);

        expect(result.payload).toBe('step-not-ready');
        expect(adapter.broadcastStep).not.toHaveBeenCalled();
        expect(getStep(store)?.status).toBe('signed');
    });

    it('rejects a step that is not signed', async () => {
        const { store, adapter } = initStore({
            staking: mockStakingState({ descriptors: [eth], sessions: [session] }),
        });
        const result = await broadcast(store);

        expect(result.payload).toBe('step-not-ready');
        expect(adapter.broadcastStep).not.toHaveBeenCalled();
    });

    it('keeps the signature after a failed broadcast, reports it and refreshes the account', async () => {
        const { store, actions } = initStore({
            broadcastStep: mock(() => Promise.reject(new StakingAdapterError('report-failed'))),
        });
        const result = await broadcast(store);

        expect(result.payload).toBe('adapter-failed');
        expect(getStep(store)).toMatchObject({
            status: 'signed',
            attemptId,
            signed,
            error: { kind: 'broadcast-failed', code: 'report-failed' },
        });
        expect(broadcastStatuses(actions)).toEqual([
            expect.objectContaining({ account, flow: 'stake', status: 'error' }),
        ]);
        expect(fetchAndUpdateAccountThunk).toHaveBeenCalledWith({ accountKey: account.key });
        expect(trackStakingStepConfirmationThunk).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith(
            'Staking step stake broadcast failed: report-failed',
        );
    });

    it('rebroadcasts the same signature after a failed attempt', async () => {
        let pushes = 0;
        const { store, adapter } = initStore({
            broadcastStep: mock<StakingProductAdapter['broadcastStep']>(() => {
                pushes += 1;

                return pushes === 1
                    ? Promise.reject(new StakingAdapterError('push-timeout'))
                    : Promise.resolve({ txid: 'tx1' });
            }),
        });

        await broadcast(store);

        const result = await broadcast(store);

        expect(result.payload).toEqual({ txid: 'tx1' });
        expect(getStep(store)).toMatchObject({ status: 'awaiting', txid: 'tx1', error: null });
        expect(adapter.broadcastStep).toHaveBeenCalledTimes(2);
        expect(adapter.broadcastStep).toHaveBeenLastCalledWith(
            expect.objectContaining({ signedStep: signed }),
        );
    });
});
