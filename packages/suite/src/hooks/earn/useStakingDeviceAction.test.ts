import { MODAL_CONTEXT_USER, modalReducer, openModal, selectModal } from '@suite/modal';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';
import { mock } from '@trezor/dependency-injection';
import { createDeferred } from '@trezor/utils';

import { useStakingDeviceAction } from './useStakingDeviceAction';
import { type MockSuiteState, mockInitialAppState } from '../../../mocks/mockInitialAppState';

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const device = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: account.deviceState },
});
const mockGuard = mock<() => Promise<boolean>>();

jest.mock('#src/hooks/wallet/useDeviceReadyGuardWithToast', () => ({
    useDeviceReadyGuardWithToast: () => mockGuard,
}));
const renderStakingDeviceAction = () => {
    const preloadedState: MockSuiteState = {
        ...mockInitialAppState,
        device: { ...mockInitialAppState.device, selectedDevice: device, devices: [device] },
    };
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState,
        reducer: (state = preloadedState, action) => ({
            ...state,
            modal: modalReducer(state.modal, action),
        }),
    });

    return {
        ...renderHookWithStoreProvider(() => useStakingDeviceAction(account), { services }),
        dispatch: services.store.dispatch,
        getModal: () => selectModal(services.store.getState()),
    };
};

describe('useStakingDeviceAction', () => {
    beforeEach(() => {
        mockGuard.mockReset();
    });

    it.each([false, true])(
        'returns to the staking form after the PIN result (verified=%s)',
        async verified => {
            const { result, dispatch, getModal } = renderStakingDeviceAction();
            dispatch(openModal({ type: 'unstake', accountKey: account.key }));
            const verify = createDeferred<boolean>();
            mockGuard.mockImplementation(() => {
                dispatch({ type: UI_REQUESTS.REQUEST_PIN, payload: { device } });

                return verify.promise;
            });
            const action = mock<() => void>();
            const pending = result.current(action);
            expect(getModal().stakingDeviceCheck?.background?.context).toBe(MODAL_CONTEXT_USER);
            dispatch({ type: UI_EVENTS.CLOSE_UI_WINDOW });
            verify.resolve(verified);
            await pending;
            expect(getModal()).toMatchObject({
                context: MODAL_CONTEXT_USER,
                payload: { type: 'unstake', accountKey: account.key },
            });
            expect(getModal().stakingDeviceCheck).toBeUndefined();
            expect(action).toHaveBeenCalledTimes(verified ? 1 : 0);
        },
    );

    it('does not continue signing after the originating modal is replaced', async () => {
        const verify = createDeferred<boolean>();
        mockGuard.mockReturnValue(verify.promise);
        const { result, dispatch, getModal } = renderStakingDeviceAction();
        dispatch(openModal({ type: 'unstake', accountKey: account.key }));
        const action = mock<() => void>();
        const pending = result.current(action);
        dispatch(openModal({ type: 'application-log' }));
        verify.resolve(true);
        await pending;
        expect(action).not.toHaveBeenCalled();
        expect(getModal()).toMatchObject({
            context: MODAL_CONTEXT_USER,
            payload: { type: 'application-log' },
        });
    });

    it('handles repeated clicks with one prompt and one staking action', async () => {
        const prompt = createDeferred<boolean>();
        mockGuard.mockReturnValue(prompt.promise);
        const action = mock<() => void>();
        const { result } = renderStakingDeviceAction();
        const first = result.current(action);
        await result.current(action);
        expect(action).not.toHaveBeenCalled();

        prompt.resolve(true);
        await first;
        expect(mockGuard).toHaveBeenCalledTimes(1);
        expect(action).toHaveBeenCalledTimes(1);
        expect(action).toHaveBeenCalledWith(device);
    });

    it('handles rejected device checks without logging account data', async () => {
        const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            mockGuard.mockRejectedValueOnce({ account });
            const action = mock<() => void>();
            const { result } = renderStakingDeviceAction();

            await act(() => result.current(action));

            expect(action).not.toHaveBeenCalled();
            expect(warning).toHaveBeenCalledWith('Staking action failed');
        } finally {
            warning.mockRestore();
        }
    });

    it('can retry again while the previous signature is settling', async () => {
        const previousSignature = createDeferred<void>();
        const signatureStarted = createDeferred<void>();
        mockGuard.mockResolvedValue(true);
        const cancelSignature = mock<() => void>();
        const action = mock<() => void>();
        const { result } = renderStakingDeviceAction();

        const firstRetry = result.current(
            () => {
                signatureStarted.resolve();

                return previousSignature.promise;
            },
            () => Promise.resolve(),
        );
        await signatureStarted.promise;
        mockGuard.mockClear();

        const retry = result.current(action, () => {
            cancelSignature();

            return previousSignature.promise;
        });

        expect(cancelSignature).toHaveBeenCalledTimes(1);
        expect(mockGuard).not.toHaveBeenCalled();
        expect(action).not.toHaveBeenCalled();

        previousSignature.resolve();
        await Promise.all([firstRetry, retry]);

        expect(mockGuard).toHaveBeenCalledTimes(1);
        expect(action).toHaveBeenCalledWith(device);
    });
});
