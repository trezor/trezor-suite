import { isAction } from '@reduxjs/toolkit';

const attemptId = 'attempt-1';

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
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

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
import { stakingActions, stakingReducer } from '../state/stakingReducer';
import { getStakingSessionKey } from '../state/stakingSessionKey';

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

const createAdapter = (composeStep: StakingProductAdapter['composeStep']) =>
    mockStakingProductAdapter({ descriptor: eth, composeStep });

const createExtra = (adapter: StakingProductAdapter): ComposeStakingStepThunkDeps => ({
    services: {
        staking: mockStakingServices({
            stakingProductRepository: mockStakingProductRepository({ get: mock(() => adapter) }),
        }),
    },
});

const createState = (
    staking = mockStakingState({ descriptors: [eth], sessions: [session] }),
): ComposeStakingStepThunkState => ({
    earn: { staking },
    wallet: { accounts: [account] },
});

const sliceActions = (actions: unknown[]) =>
    actions.filter(
        action => isAction(action) && !action.type.startsWith(STAKING_ENGINE_ACTION_PREFIX),
    );

const run = async (
    getState: () => ComposeStakingStepThunkState,
    extra: ComposeStakingStepThunkDeps,
    params: Parameters<typeof composeStakingStepThunk>[0] = { sessionKey },
) => {
    const { actions, dispatch } = createMockDispatch({ getState, extra });
    const result = await composeStakingStepThunk(params)(dispatch, getState, extra);

    return { actions: sliceActions(actions), result };
};

describe('composeStakingStepThunk', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('composes the current step through the adapter', async () => {
        const adapter = createAdapter(mock(() => Promise.resolve(composed)));
        const state = createState();
        const { actions, result } = await run(() => state, createExtra(adapter));

        expect(composeStakingStepThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toBe(composed);
        expect(adapter.composeStep).toHaveBeenCalledWith({
            account,
            plan,
            step: plan.steps[0],
            customFee: null,
        });
        expect(actions).toEqual([stakingActions.stepComposed({ ...freeze, composed })]);
    });

    it('passes a custom fee to the adapter', async () => {
        const adapter = createAdapter(mock(() => Promise.resolve(composed)));
        const customFee = { feePerUnit: '25', feeLimit: '220000' };
        const state = createState();

        await run(() => state, createExtra(adapter), { sessionKey, customFee });

        expect(adapter.composeStep).toHaveBeenCalledWith(expect.objectContaining({ customFee }));
    });

    it('rejects an invalid custom fee before the adapter sees it', async () => {
        const adapter = createAdapter(mock(() => Promise.resolve(composed)));
        const state = createState();
        const { actions, result } = await run(() => state, createExtra(adapter), {
            sessionKey,
            customFee: { feePerUnit: '25', maxFeePerGas: '30' },
        });

        expect(result.payload).toBe('invalid-custom-fee');
        expect(adapter.composeStep).not.toHaveBeenCalled();
        expect(actions).toEqual([]);
    });

    it('recomposes a step that is already composed', async () => {
        const recomposed = mockComposedStakingStep({ validityMs: 24_000 });
        const adapter = createAdapter(mock(() => Promise.resolve(recomposed)));
        const state = createState(
            stakingReducer(
                createState().earn.staking,
                stakingActions.stepComposed({ ...freeze, composed }),
            ),
        );
        const { actions, result } = await run(() => state, createExtra(adapter));

        expect(result.payload).toBe(recomposed);
        expect(actions).toEqual([stakingActions.stepComposed({ ...freeze, composed: recomposed })]);
    });

    it('rejects an unknown session', async () => {
        const adapter = createAdapter(mock(() => Promise.resolve(composed)));
        const state = createState();
        const { actions, result } = await run(() => state, createExtra(adapter), {
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
        const adapter = createAdapter(mock(() => Promise.resolve(composed)));
        const state = createState(
            [
                stakingActions.stepComposed({ ...freeze, composed }),
                stakingActions.stepSigning({
                    ...freeze,
                    attemptId,
                    feeLevel: 'normal',
                    signingStartedAt: 1,
                }),
            ].reduce(stakingReducer, createState().earn.staking),
        );
        const { result } = await run(() => state, createExtra(adapter));

        expect(result.payload).toBe('step-not-ready');
        expect(adapter.composeStep).not.toHaveBeenCalled();
    });

    it('rejects a complete session', async () => {
        const adapter = createAdapter(mock(() => Promise.resolve(composed)));
        const stake = {
            sessionKey: mockStakingSession({ accountKey: account.key }).key,
            stepId: 'stake',
        };
        const state = createState(
            [
                stakingActions.stepComposed({ ...stake, composed }),
                stakingActions.stepSigning({
                    ...stake,
                    attemptId,
                    feeLevel: 'normal',
                    signingStartedAt: 1,
                }),
                stakingActions.stepSigned({ ...stake, attemptId, signed: mockSignedStakingStep() }),
                stakingActions.stepBroadcasting({ ...stake, attemptId }),
                stakingActions.stepBroadcast({ ...stake, attemptId, txid: 'tx1' }),
            ].reduce(
                stakingReducer,
                mockStakingState({
                    descriptors: [eth],
                    sessions: [mockStakingSession({ accountKey: account.key })],
                }),
            ),
        );
        const { result } = await run(() => state, createExtra(adapter), {
            sessionKey: stake.sessionKey,
        });

        expect(result.payload).toBe('step-not-ready');
    });

    it('records an adapter failure on the step with its code', async () => {
        const adapter = createAdapter(
            mock(() => Promise.reject(new StakingAdapterError('gas-estimate-failed'))),
        );
        const state = createState();
        const { actions, result } = await run(() => state, createExtra(adapter));

        expect(result.payload).toBe('adapter-failed');
        expect(actions).toEqual([
            stakingActions.stepComposeFailed({
                ...freeze,
                error: { kind: 'compose-failed', code: 'gas-estimate-failed' },
            }),
        ]);
        expect(console.warn).toHaveBeenCalledWith(
            'Staking step freeze compose failed: gas-estimate-failed',
        );
    });

    it('records any other failure without a code', async () => {
        const adapter = createAdapter(mock(() => Promise.reject(new Error('network down'))));
        const state = createState();
        const { actions } = await run(() => state, createExtra(adapter));

        expect(actions).toEqual([
            stakingActions.stepComposeFailed({
                ...freeze,
                error: { kind: 'compose-failed', code: null },
            }),
        ]);
    });

    it('drops the result when the session was replaced meanwhile', async () => {
        let state = createState();
        const adapter = createAdapter(
            mock(() => {
                state = createState(
                    stakingReducer(
                        state.earn.staking,
                        stakingActions.sessionStarted({ session: { ...session, id: 'session-2' } }),
                    ),
                );

                return Promise.resolve(composed);
            }),
        );
        const { actions, result } = await run(() => state, createExtra(adapter));

        expect(result.payload).toBe('session-replaced');
        expect(actions).toEqual([]);
    });

    it('throws on an invalid composed step outside production', async () => {
        const invalid = { ...composed, validityMs: 0 } as ComposedStakingStep;
        const state = createState();
        const { actions, result } = await run(
            () => state,
            createExtra(createAdapter(mock(() => Promise.resolve(invalid)))),
        );

        expect(composeStakingStepThunk.rejected.match(result)).toBe(true);
        expect(result.payload).toBeUndefined();
        expect(actions).toEqual([]);
    });
});
