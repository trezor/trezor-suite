import { type Middleware, type UnknownAction, combineReducers, isAction } from '@reduxjs/toolkit';

import {
    StakingAdapterError,
    type StakingPlan,
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
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { STAKING_ENGINE_ACTION_PREFIX } from './constants';
import {
    type PlanStakingOperationThunkDeps,
    type PlanStakingOperationThunkState,
    planStakingOperationThunk,
} from './planStakingOperationThunk';
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
const sessionKey = getStakingSessionKey({
    accountKey: account.key,
    productId: eth.id,
    operation: 'stake',
});
const params = {
    accountKey: account.key,
    productId: eth.id,
    operation: 'stake' as const,
    amount: plan.amount,
    options: { instant: true },
};

type InitStoreParams = {
    planOperation?: StakingProductAdapter['planOperation'];
    staking?: StakingState;
};

const initStore = ({
    planOperation = mock(() => Promise.resolve(plan)),
    staking = mockStakingState({ descriptors: [eth] }),
}: InitStoreParams = {}) => {
    const adapter = mockStakingProductAdapter({ descriptor: eth, planOperation });
    const actions: UnknownAction[] = [];
    const recorder: Middleware = () => next => action => {
        if (isAction(action) && !action.type.startsWith(STAKING_ENGINE_ACTION_PREFIX)) {
            actions.push(action);
        }

        return next(action);
    };
    const root = createTestCompositionRoot<
        PlanStakingOperationThunkDeps,
        PlanStakingOperationThunkState
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

const planStake = (store: Store, overrides: Partial<typeof params> = {}) =>
    store.dispatch(planStakingOperationThunk({ ...params, ...overrides }));

const pendingStep = (step: (typeof plan.steps)[number]) => ({
    id: step.id,
    kind: step.kind,
    awaitConfirmation: step.awaitConfirmation,
    review: step.review,
    error: null,
    status: 'pending',
    composeAttemptId: null,
});

describe('planStakingOperationThunk', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('plans the operation and starts a session with every step pending', async () => {
        const { store, adapter, actions } = initStore();
        const result = await planStake(store);

        expect(planStakingOperationThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toBe(sessionKey);
        expect(adapter.planOperation).toHaveBeenCalledWith({
            account,
            position: null,
            operation: 'stake',
            options: { instant: true },
            amount: plan.amount,
        });
        expect(actions).toEqual([
            stakingActions.sessionStarted({
                session: {
                    id: expect.any(String),
                    key: sessionKey,
                    accountKey: account.key,
                    plan,
                    steps: plan.steps.map(pendingStep),
                    createdAt: expect.any(Number),
                },
            }),
        ]);
        expect(selectStakingSession(store.getState(), sessionKey)?.plan).toEqual(plan);
    });

    it('hands the stored position to the adapter', async () => {
        const { store, adapter } = initStore({
            staking: mockStakingState({
                descriptors: [eth],
                positions: { [account.key]: [mockStakingPosition()] },
            }),
        });

        await planStake(store);

        expect(adapter.planOperation).toHaveBeenCalledWith(
            expect.objectContaining({ position: mockStakingPosition() }),
        );
    });

    it('replaces an idle session with the same key', async () => {
        const idle = mockStakingSession({ plan, accountKey: account.key, createdAt: 1 });
        const { store, actions } = initStore({
            staking: mockStakingState({ descriptors: [eth], sessions: [idle] }),
        });
        const result = await planStake(store);

        expect(result.payload).toBe(sessionKey);
        expect(actions).toHaveLength(1);
        expect(selectStakingSession(store.getState(), sessionKey)?.id).not.toBe(idle.id);
    });

    it('rejects an unknown account', async () => {
        const { store, adapter, actions } = initStore();
        const result = await planStake(store, {
            accountKey: mockWalletAccount({ symbol: asNetworkSymbol('sol') }).key,
        });

        expect(result.payload).toBe('account-not-found');
        expect(adapter.planOperation).not.toHaveBeenCalled();
        expect(actions).toEqual([]);
    });

    it('rejects a product that is not registered', async () => {
        const sol = mockStakingProductDescriptor({
            networkSymbol: asNetworkSymbol('sol'),
            type: 'native',
        });
        const { store } = initStore();
        const result = await planStake(store, { productId: sol.id });

        expect(result.payload).toBe('product-not-found');
    });

    it('rejects while a session with the same key has an active step', async () => {
        const freeze = { sessionKey, stepId: 'freeze', attemptId };
        const { store, adapter, actions } = initStore({
            staking: [
                stakingActions.stepComposed({ ...freeze, composed: mockComposedStakingStep() }),
                stakingActions.stepSigning({ ...freeze, feeLevel: 'normal', signingStartedAt: 1 }),
            ].reduce(
                stakingReducer,
                mockStakingState({
                    descriptors: [eth],
                    sessions: [mockStakingSession({ plan, accountKey: account.key })],
                }),
            ),
        });
        const result = await planStake(store);

        expect(result.payload).toBe('session-active');
        expect(adapter.planOperation).not.toHaveBeenCalled();
        expect(actions).toEqual([]);
    });

    it('drops a plan result when a newer plan started meanwhile', async () => {
        jest.useFakeTimers();

        let store: Store | null = null;
        const newerPlan = mockStakingPlan({ amount: '2000000000000000000' as never });
        let calls = 0;
        const started = initStore({
            planOperation: mock(async () => {
                calls += 1;

                if (calls > 1) return newerPlan;

                jest.setSystemTime(Date.now() + 1);
                await store?.dispatch(planStakingOperationThunk(params)).unwrap();

                return plan;
            }),
        });

        store = started.store;

        const result = await planStake(store);

        expect(result.payload).toBe('attempt-superseded');
        expect(selectStakingSession(store.getState(), sessionKey)?.plan).toEqual(newerPlan);
        expect(started.actions).toHaveLength(2);
    });

    it('rejects when the adapter cannot plan and starts no session', async () => {
        const { store, actions } = initStore({
            planOperation: mock(() =>
                Promise.reject(new StakingAdapterError('amount-below-minimum')),
            ),
        });
        const result = await planStake(store);

        expect(result.payload).toBe('adapter-failed');
        expect(actions).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith(
            'Staking stake plan failed: amount-below-minimum',
        );
    });

    it('throws on an invalid plan outside production', async () => {
        const invalidPlan = { ...plan, steps: [] } as StakingPlan;
        const { store, actions } = initStore({
            planOperation: mock(() => Promise.resolve(invalidPlan)),
        });
        const result = await planStake(store);

        expect(planStakingOperationThunk.rejected.match(result)).toBe(true);
        expect(result.payload).toBeUndefined();
        expect(actions).toEqual([]);
    });
});
