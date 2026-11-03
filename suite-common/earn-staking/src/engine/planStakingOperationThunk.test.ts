import { isAction } from '@reduxjs/toolkit';

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
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

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
import { stakingActions, stakingReducer } from '../state/stakingReducer';
import { getStakingSessionKey } from '../state/stakingSessionKey';
import type { StakingSession } from '../state/stakingSessionsReducer';

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

const createAdapter = (planOperation: StakingProductAdapter['planOperation']) =>
    mockStakingProductAdapter({ descriptor: eth, planOperation });

const createExtra = (adapter: StakingProductAdapter): PlanStakingOperationThunkDeps => ({
    services: {
        staking: mockStakingServices({
            stakingProductRepository: mockStakingProductRepository({ get: mock(() => adapter) }),
        }),
    },
});

type CreateStateParams = {
    sessions?: readonly StakingSession[];
    hasPosition?: boolean;
};

const createState = ({
    sessions = [],
    hasPosition = false,
}: CreateStateParams = {}): PlanStakingOperationThunkState => ({
    earn: {
        staking: mockStakingState({
            descriptors: [eth],
            sessions,
            positions: hasPosition ? { [account.key]: [mockStakingPosition()] } : {},
        }),
    },
    wallet: { accounts: [account] },
});

const sliceActions = (actions: unknown[]) =>
    actions.filter(
        action => isAction(action) && !action.type.startsWith(STAKING_ENGINE_ACTION_PREFIX),
    );

const run = async (
    state: PlanStakingOperationThunkState,
    extra: PlanStakingOperationThunkDeps,
    overrides: Partial<typeof params> = {},
) => {
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra });
    const result = await planStakingOperationThunk({ ...params, ...overrides })(
        dispatch,
        getState,
        extra,
    );

    return { actions: sliceActions(actions), result };
};

describe('planStakingOperationThunk', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('plans the operation and starts a session with every step pending', async () => {
        const adapter = createAdapter(mock(() => Promise.resolve(plan)));
        const { actions, result } = await run(createState(), createExtra(adapter));

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
                    steps: [
                        {
                            id: 'freeze',
                            kind: 'freeze',
                            awaitConfirmation: true,
                            review: 'app-and-device',
                            error: null,
                            status: 'pending',
                        },
                        {
                            id: 'vote',
                            kind: 'vote',
                            awaitConfirmation: false,
                            review: 'app-and-device',
                            error: null,
                            status: 'pending',
                        },
                    ],
                    createdAt: expect.any(Number),
                },
            }),
        ]);
    });

    it('hands the stored position to the adapter', async () => {
        const adapter = createAdapter(mock(() => Promise.resolve(plan)));

        await run(createState({ hasPosition: true }), createExtra(adapter));

        expect(adapter.planOperation).toHaveBeenCalledWith(
            expect.objectContaining({ position: mockStakingPosition() }),
        );
    });

    it('replaces an idle session with the same key', async () => {
        const idle = mockStakingSession({ plan, accountKey: account.key });
        const { actions, result } = await run(
            createState({ sessions: [idle] }),
            createExtra(createAdapter(mock(() => Promise.resolve(plan)))),
        );

        expect(result.payload).toBe(sessionKey);
        expect(actions).toHaveLength(1);
    });

    it('rejects an unknown account', async () => {
        const adapter = createAdapter(mock(() => Promise.resolve(plan)));
        const { actions, result } = await run(createState(), createExtra(adapter), {
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
        const { result } = await run(
            createState(),
            createExtra(createAdapter(mock(() => Promise.resolve(plan)))),
            { productId: sol.id },
        );

        expect(result.payload).toBe('product-not-found');
    });

    it('rejects while a session with the same key has an active step', async () => {
        const state = createState({
            sessions: [mockStakingSession({ plan, accountKey: account.key })],
        });
        const signing = [
            stakingActions.stepComposed({
                sessionKey,
                stepId: 'freeze',
                composed: mockComposedStakingStep(),
            }),
            stakingActions.stepSigning({
                sessionKey,
                stepId: 'freeze',
                feeLevel: 'normal',
                signingStartedAt: 1,
            }),
        ].reduce(stakingReducer, state.earn.staking);
        const adapter = createAdapter(mock(() => Promise.resolve(plan)));
        const { actions, result } = await run(
            { ...state, earn: { staking: signing } },
            createExtra(adapter),
        );

        expect(result.payload).toBe('session-active');
        expect(adapter.planOperation).not.toHaveBeenCalled();
        expect(actions).toEqual([]);
    });

    it('rejects when the adapter cannot plan and starts no session', async () => {
        const adapter = createAdapter(
            mock(() => Promise.reject(new StakingAdapterError('amount-below-minimum'))),
        );
        const { actions, result } = await run(createState(), createExtra(adapter));

        expect(result.payload).toBe('adapter-failed');
        expect(actions).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith(
            'Staking stake plan failed: amount-below-minimum',
        );
    });

    it('throws on an invalid plan outside production', async () => {
        const invalidPlan = { ...plan, steps: [] } as StakingPlan;
        const { actions, result } = await run(
            createState(),
            createExtra(createAdapter(mock(() => Promise.resolve(invalidPlan)))),
        );

        expect(planStakingOperationThunk.rejected.match(result)).toBe(true);
        expect(result.payload).toBeUndefined();
        expect(actions).toEqual([]);
    });
});
