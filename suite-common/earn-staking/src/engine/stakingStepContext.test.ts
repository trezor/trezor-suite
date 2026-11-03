import { StakingAdapterError } from '@suite-common/earn-staking-common';
import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type GetStakingStepContextParams,
    callStakingAdapter,
    getStakingStepContext,
    isStakingSessionCurrent,
    warnStakingAdapterFailure,
} from './stakingStepContext';
import { mockStakingProductRepository, mockStakingSession, mockStakingState } from '../../mocks';
import { stakingActions, stakingReducer } from '../state/stakingReducer';
import { getStakingSessionKey } from '../state/stakingSessionKey';

const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const session = mockStakingSession({ accountKey: account.key });
const adapter = mockStakingProductAdapter({ descriptor: eth });
const stakingProductRepository = mockStakingProductRepository({ get: mock(() => adapter) });
const stake = { sessionKey: session.key, stepId: 'stake' };

const createState = (
    sessions = [session],
    accounts = [account],
): GetStakingStepContextParams['state'] => ({
    earn: { staking: mockStakingState({ descriptors: [eth], sessions }) },
    wallet: { accounts },
});

describe('getStakingStepContext', () => {
    it('resolves the session, its current step, the plan step, the account and the adapter', () => {
        const result = getStakingStepContext({
            state: createState(),
            sessionKey: session.key,
            stakingProductRepository,
        });

        expect(result).toEqual({
            success: true,
            context: {
                session,
                step: session.steps[0],
                planStep: session.plan.steps[0],
                account,
                adapter,
            },
        });
        expect(stakingProductRepository.get).toHaveBeenCalledWith(eth.id);
    });

    it('rejects an unknown session', () => {
        const result = getStakingStepContext({
            state: createState(),
            sessionKey: getStakingSessionKey({
                accountKey: account.key,
                productId: eth.id,
                operation: 'unstake',
            }),
            stakingProductRepository,
        });

        expect(result).toEqual({ success: false, rejection: 'session-not-found' });
    });

    it('rejects a complete session', () => {
        const state = createState();
        const complete = [
            stakingActions.stepComposed({ ...stake, composed: mockComposedStakingStep() }),
            stakingActions.stepSigning({ ...stake, feeLevel: 'normal', signingStartedAt: 1 }),
            stakingActions.stepSigned({ ...stake, signed: mockSignedStakingStep() }),
            stakingActions.stepBroadcasting(stake),
            stakingActions.stepBroadcast({ ...stake, txid: 'tx1' }),
        ].reduce(stakingReducer, state.earn.staking);

        expect(
            getStakingStepContext({
                state: { ...state, earn: { staking: complete } },
                sessionKey: session.key,
                stakingProductRepository,
            }),
        ).toEqual({ success: false, rejection: 'step-not-ready' });
    });

    it('rejects a session whose account is gone', () => {
        expect(
            getStakingStepContext({
                state: createState([session], []),
                sessionKey: session.key,
                stakingProductRepository,
            }),
        ).toEqual({ success: false, rejection: 'account-not-found' });
    });
});

describe('isStakingSessionCurrent', () => {
    it('tells a replaced session from the one a thunk started with', () => {
        const state = createState();
        const replaced = stakingReducer(
            state.earn.staking,
            stakingActions.sessionStarted({ session: { ...session, id: 'session-2' } }),
        );

        expect(isStakingSessionCurrent(state, session)).toBe(true);
        expect(isStakingSessionCurrent({ earn: { staking: replaced } }, session)).toBe(false);
        expect(isStakingSessionCurrent(createState([]), session)).toBe(false);
    });
});

describe('callStakingAdapter', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns the payload of a call that resolves', async () => {
        expect(await callStakingAdapter(() => Promise.resolve({ txid: 'tx1' }))).toEqual({
            success: true,
            payload: { txid: 'tx1' },
        });
    });

    it('keeps the code of an adapter error and logs it', async () => {
        const error = new StakingAdapterError('report-failed');
        const result = await callStakingAdapter(() => Promise.reject(error));

        expect(result).toEqual({ success: false, code: 'report-failed', error });

        if (!result.success) warnStakingAdapterFailure('vote broadcast', result);

        expect(console.warn).toHaveBeenCalledWith('Staking vote broadcast failed: report-failed');
    });

    it('logs only the name of any other error', async () => {
        const error = new TypeError('secret payload');
        const result = await callStakingAdapter(() => Promise.reject(error));

        expect(result).toEqual({ success: false, code: null, error });

        if (!result.success) warnStakingAdapterFailure('stake compose', result);

        expect(console.warn).toHaveBeenCalledWith('Staking stake compose failed: TypeError');
    });
});
