import {
    selectDeviceButtonRequestsCodes,
    selectIsDeviceConnectedAndAuthorized,
} from '@suite-common/device';
import {
    AuthorizeDeviceStackRoutes,
    type NavigateParameters,
    type RootStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';
import { act, renderHookWithStoreProvider, waitFor } from '@suite-native/test-utils-store';

import { useDeviceGuardedSign } from './useDeviceGuardedSign';

const mockNavigate = jest.fn();
// The hook registers its focus handler via useFocusEffect; capture it so the test can simulate the
// screen regaining focus after the device-connection guard.
let capturedFocusHandler: (() => void) | undefined;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (handler: () => void) => {
        capturedFocusHandler = handler;
    },
}));

jest.mock('@suite-common/device', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnectedAndAuthorized: jest.fn(),
    selectDeviceButtonRequestsCodes: jest.fn(),
}));

const selectIsDeviceConnectedAndAuthorizedMock =
    selectIsDeviceConnectedAndAuthorized as unknown as jest.Mock;
const selectDeviceButtonRequestsCodesMock = selectDeviceButtonRequestsCodes as unknown as jest.Mock;

// Stable references so react-redux's reference-equality useSelector doesn't re-render every tick.
const NO_BUTTON_REQUESTS: number[] = [];
const WITH_BUTTON_REQUEST: number[] = [1];

// Opaque pass-through target: the hook only forwards it to the guard's onCancelNavigationTarget.
const cancelNavigationTarget = {
    name: RootStackRoutes.TransactionDetailStack,
} as unknown as NavigateParameters<RootStackParamList>;

const renderGuardedSign = (sign: () => Promise<void>) =>
    renderHookWithStoreProvider(() => useDeviceGuardedSign({ sign, cancelNavigationTarget }));

describe('useDeviceGuardedSign', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedFocusHandler = undefined;
        selectIsDeviceConnectedAndAuthorizedMock.mockReturnValue(true);
        selectDeviceButtonRequestsCodesMock.mockReturnValue(NO_BUTTON_REQUESTS);
    });

    it('routes requestSign through the device-connection guard, forwarding the cancel target', () => {
        const { result } = renderGuardedSign(jest.fn().mockResolvedValue(undefined));

        act(() => result.current.requestSign());

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            params: { onCancelNavigationTarget: cancelNavigationTarget },
        });
    });

    it('runs the pending sign when the screen regains focus with an authorized device', async () => {
        const sign = jest.fn().mockResolvedValue(undefined);
        const { result } = renderGuardedSign(sign);

        act(() => result.current.requestSign());
        await act(async () => {
            capturedFocusHandler?.();
            await Promise.resolve();
        });

        expect(sign).toHaveBeenCalledTimes(1);
    });

    it('does not sign on focus when the device is not authorized', async () => {
        selectIsDeviceConnectedAndAuthorizedMock.mockReturnValue(false);
        const sign = jest.fn().mockResolvedValue(undefined);
        const { result } = renderGuardedSign(sign);

        act(() => result.current.requestSign());
        await act(async () => {
            capturedFocusHandler?.();
            await Promise.resolve();
        });

        expect(sign).not.toHaveBeenCalled();
    });

    it('does not sign on focus when no sign was requested', async () => {
        const sign = jest.fn().mockResolvedValue(undefined);
        renderGuardedSign(sign);

        await act(async () => {
            capturedFocusHandler?.();
            await Promise.resolve();
        });

        expect(sign).not.toHaveBeenCalled();
    });

    it('reports waiting-for-device while signing and the device shows a button request', async () => {
        selectDeviceButtonRequestsCodesMock.mockReturnValue(WITH_BUTTON_REQUEST);
        let resolveSign: () => void = () => {};
        const sign = jest.fn(
            () =>
                new Promise<void>(resolve => {
                    resolveSign = resolve;
                }),
        );
        const { result } = renderGuardedSign(sign);

        expect(result.current.isSigning).toBe(false);
        expect(result.current.isWaitingForDevice).toBe(false);

        act(() => result.current.requestSign());
        await act(async () => {
            capturedFocusHandler?.();
            await Promise.resolve();
        });

        // The mutation's pending state propagates on the next notify tick, not synchronously.
        await waitFor(() => expect(result.current.isSigning).toBe(true));
        expect(result.current.isWaitingForDevice).toBe(true);

        await act(async () => {
            resolveSign();
            await Promise.resolve();
        });

        await waitFor(() => expect(result.current.isSigning).toBe(false));
    });
});
