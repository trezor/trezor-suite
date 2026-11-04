import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

const attemptId = 'attempt-1';

import {
    type DiscardStakingSessionThunkState,
    discardStakingSessionThunk,
} from './discardStakingSessionThunk';
import { mockStakingSession, mockStakingState } from '../../mocks';
import { type StakingState, stakingActions, stakingReducer } from '../state/stakingReducer';
import { getStakingSessionKey } from '../state/stakingSessionKey';

const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const session = mockStakingSession({ accountKey: account.key });
const { key: sessionKey } = session;
const stake = { sessionKey, stepId: 'stake' };

const idle = mockStakingState({ descriptors: [eth], sessions: [session] });
const signing = [
    stakingActions.stepComposed({ ...stake, composed: mockComposedStakingStep() }),
    stakingActions.stepSigning({ ...stake, attemptId, feeLevel: 'normal', signingStartedAt: 1 }),
].reduce(stakingReducer, idle);
const broadcasting = [
    stakingActions.stepSigned({ ...stake, attemptId, signed: mockSignedStakingStep() }),
    stakingActions.stepBroadcasting({ ...stake, attemptId }),
].reduce(stakingReducer, signing);
const awaiting = stakingReducer(
    broadcasting,
    stakingActions.stepBroadcast({ ...stake, attemptId, txid: 'tx1' }),
);

const isStakingAction = (action: unknown) =>
    Object.values(stakingActions).some(creator => creator.match(action));

const run = async (staking: StakingState, key = sessionKey) => {
    const state: DiscardStakingSessionThunkState = { earn: { staking } };
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState });
    const result = await discardStakingSessionThunk({ sessionKey: key })(dispatch, getState, {});

    return { actions: actions.filter(isStakingAction), result };
};

describe('discardStakingSessionThunk', () => {
    it.each([
        ['idle', idle],
        ['awaiting', awaiting],
    ])('discards a session whose step is %s', async (_status, staking) => {
        const { actions, result } = await run(staking);

        expect(discardStakingSessionThunk.fulfilled.match(result)).toBe(true);
        expect(actions).toEqual([stakingActions.sessionDiscarded({ sessionKey })]);
    });

    it.each([
        ['signing', signing],
        ['broadcasting', broadcasting],
    ])('refuses while a step is %s', async (_status, staking) => {
        const { actions, result } = await run(staking);

        expect(result.payload).toBe('step-in-flight');
        expect(actions).toEqual([]);
    });

    it('rejects an unknown session', async () => {
        const { result } = await run(
            idle,
            getStakingSessionKey({
                accountKey: account.key,
                productId: eth.id,
                operation: 'claim',
            }),
        );

        expect(result.payload).toBe('session-not-found');
    });
});
