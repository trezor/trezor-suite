import { type AnalyticsSharedEvents, events } from '@suite-common/analytics';
import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type CancelStakingStepThunkDeps,
    type CancelStakingStepThunkState,
    cancelStakingStepThunk,
} from './cancelStakingStepThunk';
import {
    mockStakingDeviceAccess,
    mockStakingProductRepository,
    mockStakingServices,
    mockStakingSession,
    mockStakingState,
} from '../../mocks';
import { type StakingState, stakingActions, stakingReducer } from '../state/stakingReducer';

const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const session = mockStakingSession({ accountKey: account.key });
const { key: sessionKey } = session;
const stake = { sessionKey, stepId: 'stake' };

const composedState = stakingReducer(
    mockStakingState({ descriptors: [eth], sessions: [session] }),
    stakingActions.stepComposed({ ...stake, composed: mockComposedStakingStep() }),
);
const signingState = stakingReducer(
    composedState,
    stakingActions.stepSigning({ ...stake, feeLevel: 'normal', signingStartedAt: 1 }),
);
const signedState = stakingReducer(
    signingState,
    stakingActions.stepSigned({ ...stake, signed: mockSignedStakingStep() }),
);

const isStakingAction = (action: unknown) =>
    Object.values(stakingActions).some(creator => creator.match(action));

const run = async (staking: StakingState) => {
    const state: CancelStakingStepThunkState = {
        earn: { staking },
        wallet: { accounts: [account] },
    };
    const deviceAccess = mockStakingDeviceAccess();
    const analytics = mockAnalytics<AnalyticsSharedEvents>();
    const extra: CancelStakingStepThunkDeps = {
        services: {
            staking: mockStakingServices({
                stakingProductRepository: mockStakingProductRepository({
                    get: mock(() => mockStakingProductAdapter({ descriptor: eth })),
                }),
                deviceAccess,
            }),
            analytics,
        },
    };
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra });
    const result = await cancelStakingStepThunk({ sessionKey })(dispatch, getState, extra);

    return { actions: actions.filter(isStakingAction), result, deviceAccess, analytics };
};

describe('cancelStakingStepThunk', () => {
    it('cancels the device call and resets a signing step', async () => {
        const { actions, result, deviceAccess, analytics } = await run(signingState);

        expect(cancelStakingStepThunk.fulfilled.match(result)).toBe(true);
        expect(deviceAccess.cancel).toHaveBeenCalledWith('tx-cancelled');
        expect(actions).toEqual([stakingActions.stepReset({ ...stake, error: null })]);
        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('resets a signed step and reports the declined review', async () => {
        const { actions, result, deviceAccess, analytics } = await run(signedState);

        expect(cancelStakingStepThunk.fulfilled.match(result)).toBe(true);
        expect(deviceAccess.cancel).not.toHaveBeenCalled();
        expect(actions).toEqual([stakingActions.stepReset({ ...stake, error: null })]);
        expect(analytics.report).toHaveBeenCalledWith({
            type: events.transactionCancelEvent.name,
            payload: { txType: 'stake', networkSymbol: 'eth', stage: 'review' },
        });
    });

    it('rejects a step that is neither signing nor signed', async () => {
        const { actions, result, deviceAccess } = await run(composedState);

        expect(result.payload).toBe('step-not-ready');
        expect(actions).toEqual([]);
        expect(deviceAccess.cancel).not.toHaveBeenCalled();
    });
});
