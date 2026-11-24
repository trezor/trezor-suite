import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { MODAL_CONTEXT_NONE, MODAL_OPEN_USER_CONTEXT, type ModalRootState } from '@suite/modal';
import { type DeviceRootState, deviceActions, deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type TronFlow,
    type TronStakeRootState,
    initialTronStakeTxReview,
    submitTronClaimThunk,
    submitTronFreezeThunk,
    submitTronUnstakeThunk,
    submitTronVoteThunk,
    submitTronWithdrawThunk,
} from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type WithServices } from '@trezor/redux-utils';
import { createDeferred } from '@trezor/utils';

import { useTronStakeActions } from './useTronStakeActions';
import { useTronStakeForm } from './useTronStakeForm';

const mockEnsureReady = jest.fn();
jest.mock('#src/hooks/wallet/useDeviceReadyGuardWithToast', () => ({
    useDeviceReadyGuardWithToast: () => mockEnsureReady,
}));
jest.mock('#src/hooks/suite/useMessageSystemStaking', () => ({
    useMessageSystemStaking: () => ({}),
}));
jest.mock('@suite-common/earn-staking-api', () => ({
    useTronStakingStats: () => ({ stats: {} }),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('trx') });
const buildDevice = (minor_version: number) =>
    mockSuiteDevice(
        { connected: true, available: true, state: { staticSessionId: account.deviceState } },
        { major_version: 2, minor_version, patch_version: 2 },
    );

const renderActions = (flow: TronFlow, device = buildDevice(12)) => {
    const initialState: TronStakeRootState & DeviceRootState & ModalRootState = {
        modal: { context: MODAL_CONTEXT_NONE },
        wallet: { tronStake: { sessions: {}, txReview: initialTronStakeTxReview } },
        device: { ...deviceInitialState, devices: [device], selectedDevice: device },
    };
    const { services } = createTestCompositionRoot<
        WithServices<DesktopAnalyticsDep>,
        TronStakeRootState & DeviceRootState & ModalRootState
    >({
        preloadedState: initialState,
        reducer: (state = initialState, action) =>
            deviceActions.deviceDisconnect.match(action)
                ? { ...state, device: { ...state.device, selectedDevice: undefined } }
                : state,
        services: () => ({ analytics: mockDesktopAnalytics() }),
    });
    const { result } = renderHookWithStoreProvider(
        () => {
            const form = useTronStakeForm({ account, flow });

            return useTronStakeActions({ account, flow, form });
        },
        { services },
    );

    return { result, store: services.store };
};

it('declines the late signature without opening a review after its device disconnects', async () => {
    mockEnsureReady.mockResolvedValueOnce(true);
    const device = buildDevice(12);
    const { result, store } = renderActions('stake', device);
    await act(() => result.current.submitAction());

    const signing = store.getActions().find(submitTronFreezeThunk.pending.match);
    expect(signing).toBeDefined();

    act(() => {
        store.dispatch(deviceActions.deviceDisconnect(device));
    });
    const review = signing!.meta.arg.requestPushApproval();

    expect(store.getActions()).not.toContainEqual(
        expect.objectContaining({ type: MODAL_OPEN_USER_CONTEXT }),
    );
    await expect(review).resolves.toBe(false);
});

it.each([
    ['stake', submitTronFreezeThunk.pending.type],
    ['unstake', submitTronUnstakeThunk.pending.type],
    ['claim', submitTronClaimThunk.pending.type],
    ['withdraw', submitTronWithdrawThunk.pending.type],
    ['vote', submitTronVoteThunk.pending.type],
] as const)(
    'waits for device readiness before submitting the %s form',
    async (flow, pendingType) => {
        const readiness = createDeferred<boolean>();
        mockEnsureReady.mockReturnValueOnce(readiness.promise);
        const { result, store } = renderActions(flow);
        const submitted = result.current.submitAction();

        expect(store.getActions()).toEqual([]);
        expect(mockEnsureReady).toHaveBeenCalled();

        await act(async () => {
            readiness.resolve(true);
            await submitted;
        });

        expect(store.getActions()).toContainEqual(
            expect.objectContaining({
                type: pendingType,
                meta: expect.objectContaining({
                    arg: expect.objectContaining({
                        account,
                        device: expect.objectContaining({ connected: true }),
                    }),
                }),
            }),
        );
    },
);

it('opens the firmware upgrade dialog if the verified device cannot claim rewards', async () => {
    mockEnsureReady.mockResolvedValueOnce(true);
    const { result, store } = renderActions('claim', buildDevice(11));
    const openFirmwareModal = jest.fn();

    await result.current.submitAction(openFirmwareModal);

    expect(openFirmwareModal).toHaveBeenCalledTimes(1);
    expect(store.getActions()).toEqual([]);
});
