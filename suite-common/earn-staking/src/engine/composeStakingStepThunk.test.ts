import { type Middleware, type UnknownAction, combineReducers, isAction } from '@reduxjs/toolkit';

import {
    type ComposedStakingStep,
    StakingAdapterError,
    type StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingPlan,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type ComposeStakingStepThunkDeps,
    type ComposeStakingStepThunkState,
    composeStakingStepThunk,
} from './composeStakingStepThunk';
import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import {
    mockStakingProductRepository,
    mockStakingServices,
    mockStakingSession,
    mockStakingState,
} from '../../mocks';
import { type StakingState, stakingActions, stakingReducer } from '../state/stakingReducer';
import { getStakingSessionKey } from '../state/stakingSessionKey';
import { selectStakingSession } from '../state/stakingSessionSelectors';

const attemptId = 'attempt-1';
const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const plan = mockStakingPlan({
    steps: [
        mockStakingStep({ id: 'freeze', kind: 'freeze', awaitConfirmation: true }),
        mockStakingStep({ id: 'vote', kind: 'vote' }),
    ],
});
const session = mockStakingSession({ plan, accountKey: account.key });
const sessionKey = session.key;
const freeze = { sessionKey, stepId: 'freeze' };
const composed = mockComposedStakingStep();
const anyAttempt = { ...freeze, attemptId: expect.any(String) as string };

type InitStoreParams = {
    composeStep?: StakingProductAdapter['composeStep'];
    staking?: StakingState;
};

const initStore = ({
    composeStep = mock(() => Promise.resolve(composed)),
    staking = mockStakingState({ descriptors: [eth], sessions: [session] }),
}: InitStoreParams = {}) => {
    const adapter = mockStakingProductAdapter({ descriptor: eth, composeStep });
    const actions: UnknownAction[] = [];
    const recorder: Middleware = () => next => action => {
        if (isAction(action) && !action.type.startsWith(STAKING_ENGINE_ACTION_PREFIX)) {
            actions.push(action);
        }

        return next(action);
    };
    const root = createTestCompositionRoot<
        ComposeStakingStepThunkDeps,
        ComposeStakingStepThunkState
    >({
        services: () => ({
            staking: mockStakingServices({
                stakingProductRepository: mockStakingProductRepository({
                    get: mock(() => adapter),
                }),
            }),
        }),
        middleware: [recorder],
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            wallet: combineReducers({ accounts: (state = [account]) => state }),
        },
        preloadedState: { earn: { staking } },
    });

    return { store: root.services.store, adapter, actions };
};

type Store = ReturnType<typeof initStore>['store'];

const getStep = (store: Store, key = sessionKey) =>
    selectStakingSession(store.getState(), key)?.steps[0];

const compose = (
    store: Store,
    params: Parameters<typeof composeStakingStepThunk>[0] = { sessionKey },
) => store.dispatch(composeStakingStepThunk(params));

const composedState = (step: ComposedStakingStep = composed) =>
    stakingReducer(
        mockStakingState({ descriptors: [eth], sessions: [session] }),
        stakingActions.stepComposed({ ...freeze, attemptId, composed: step }),
    );

describe('composeStakingStepThunk', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('composes the current step through the adapter', async () => {
        const { store, adapter, actions } = initStore();
        const result = await compose(store);

        expect(composeStakingStepThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toEqual(composed);
        expect(adapter.composeStep).toHaveBeenCalledWith({
            account,
            plan,
            step: plan.steps[0],
            customFee: null,
        });
        expect(actions).toEqual([
            stakingActions.stepComposing(anyAttempt),
            stakingActions.stepComposed({ ...anyAttempt, composed }),
        ]);
        expect(getStep(store)).toMatchObject({
            status: 'composed',
            composed,
            composeAttemptId: expect.any(String),
        });
    });

    it('passes a custom fee to the adapter', async () => {
        const { store, adapter } = initStore();
        const customFee = { feePerUnit: '25', feeLimit: '220000' };

        await compose(store, { sessionKey, customFee });

        expect(adapter.composeStep).toHaveBeenCalledWith(expect.objectContaining({ customFee }));
    });

    it('rejects an invalid custom fee before the adapter sees it', async () => {
        const { store, adapter, actions } = initStore();
        const result = await compose(store, {
            sessionKey,
            customFee: { feePerUnit: '25', maxFeePerGas: '30' },
        });

        expect(result.payload).toBe('invalid-custom-fee');
        expect(adapter.composeStep).not.toHaveBeenCalled();
        expect(actions).toEqual([]);
    });

    it('recomposes a step that is already composed', async () => {
        const recomposed = mockComposedStakingStep({ validityMs: 24_000 });
        const { store, actions } = initStore({
            composeStep: mock(() => Promise.resolve(recomposed)),
            staking: composedState(),
        });
        const result = await compose(store);

        expect(result.payload).toEqual(recomposed);
        expect(actions).toEqual([
            stakingActions.stepComposing(anyAttempt),
            stakingActions.stepComposed({ ...anyAttempt, composed: recomposed }),
        ]);
    });

    it('rejects an unknown session', async () => {
        const { store, adapter, actions } = initStore();
        const result = await compose(store, {
            sessionKey: getStakingSessionKey({
                accountKey: account.key,
                productId: eth.id,
                operation: 'claim',
            }),
        });

        expect(result.payload).toBe('session-not-found');
        expect(adapter.composeStep).not.toHaveBeenCalled();
        expect(actions).toEqual([]);
    });

    it('rejects a step that is past composing', async () => {
        const { store, adapter, actions } = initStore({
            staking: stakingReducer(
                composedState(),
                stakingActions.stepSigning({
                    ...freeze,
                    attemptId,
                    feeLevel: 'normal',
                    signingStartedAt: 1,
                }),
            ),
        });
        const result = await compose(store);

        expect(result.payload).toBe('step-not-ready');
        expect(adapter.composeStep).not.toHaveBeenCalled();
        expect(actions).toEqual([]);
    });

    it('rejects a complete session', async () => {
        const stakeSession = mockStakingSession({ accountKey: account.key });
        const stake = { sessionKey: stakeSession.key, stepId: 'stake', attemptId };
        const { store } = initStore({
            staking: [
                stakingActions.stepComposed({ ...stake, composed }),
                stakingActions.stepSigning({ ...stake, feeLevel: 'normal', signingStartedAt: 1 }),
                stakingActions.stepSigned({ ...stake, signed: mockSignedStakingStep() }),
                stakingActions.stepBroadcasting(stake),
                stakingActions.stepBroadcast({ ...stake, txid: 'tx1' }),
            ].reduce(
                stakingReducer,
                mockStakingState({ descriptors: [eth], sessions: [stakeSession] }),
            ),
        });
        const result = await compose(store, { sessionKey: stakeSession.key });

        expect(result.payload).toBe('step-not-ready');
    });

    it('records an adapter failure on the step with its code', async () => {
        const { store, actions } = initStore({
            composeStep: mock(() => Promise.reject(new StakingAdapterError('gas-estimate-failed'))),
        });
        const result = await compose(store);

        expect(result.payload).toBe('adapter-failed');
        expect(actions).toEqual([
            stakingActions.stepComposing(anyAttempt),
            stakingActions.stepComposeFailed({
                ...anyAttempt,
                error: { kind: 'compose-failed', code: 'gas-estimate-failed' },
            }),
        ]);
        expect(getStep(store)).toMatchObject({
            status: 'pending',
            error: { kind: 'compose-failed', code: 'gas-estimate-failed' },
        });
        expect(console.warn).toHaveBeenCalledWith(
            'Staking step freeze compose failed: gas-estimate-failed',
        );
    });

    it('records any other failure without a code', async () => {
        const { store, actions } = initStore({
            composeStep: mock(() => Promise.reject(new Error('network down'))),
        });

        await compose(store);

        expect(actions).toEqual([
            stakingActions.stepComposing(anyAttempt),
            stakingActions.stepComposeFailed({
                ...anyAttempt,
                error: { kind: 'compose-failed', code: null },
            }),
        ]);
    });

    it('drops the result when the session was replaced meanwhile', async () => {
        let store: Store | null = null;
        const started = initStore({
            composeStep: mock(() => {
                store?.dispatch(
                    stakingActions.sessionStarted({ session: { ...session, id: 'session-2' } }),
                );

                return Promise.resolve(composed);
            }),
        });

        store = started.store;

        const result = await compose(store);

        expect(result.payload).toBe('session-replaced');
        expect(started.actions.filter(stakingActions.stepComposed.match)).toEqual([]);
        expect(getStep(store)).toMatchObject({ status: 'pending', composeAttemptId: null });
    });

    it('drops the result when a newer compose started meanwhile', async () => {
        let store: Store | null = null;
        const newer = mockComposedStakingStep({ validityMs: 24_000 });
        let calls = 0;
        const started = initStore({
            composeStep: mock(async () => {
                calls += 1;

                if (calls > 1) return newer;

                await store?.dispatch(composeStakingStepThunk({ sessionKey })).unwrap();

                return composed;
            }),
        });

        store = started.store;

        const result = await compose(store);

        expect(result.payload).toBe('attempt-superseded');
        expect(getStep(store)).toMatchObject({ status: 'composed', composed: newer });
        expect(started.actions.filter(stakingActions.stepComposed.match)).toHaveLength(1);
    });

    it('throws on an invalid composed step outside production', async () => {
        const invalid = { ...composed, validityMs: 0 } as ComposedStakingStep;
        const { store, actions } = initStore({ composeStep: mock(() => Promise.resolve(invalid)) });
        const result = await compose(store);

        expect(composeStakingStepThunk.rejected.match(result)).toBe(true);
        expect(result.payload).toBeUndefined();
        expect(actions.filter(stakingActions.stepComposed.match)).toEqual([]);
    });
});
