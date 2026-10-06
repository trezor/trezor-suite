import { type NetworkType } from '@suite-common/wallet-config';
import { getTxValidityTimeoutInMs } from '@suite-common/wallet-utils';
import { act, renderHook } from '@suite-native/test-utils';
import TrezorConnect from '@trezor/connect';

import { useTxValidityTimer } from './useTxValidityTimer';

type Params = Parameters<typeof useTxValidityTimer>[0];

const mockShowAlert = jest.fn();

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

jest.mock('@trezor/react-utils', () => ({
    ...jest.requireActual('@trezor/react-utils'),
    useCountdownTimer: jest.fn(),
    useClickCooldown: jest.fn(),
}));

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    cancel: jest.fn(),
}));

const mockUseCountdownTimer = jest.requireMock('@trezor/react-utils').useCountdownTimer;
const mockUseClickCooldown = jest.requireMock('@trezor/react-utils').useClickCooldown;
const mockTrezorConnectCancel = TrezorConnect.cancel as jest.Mock;

// Actual value the real `getTxValidityTimeoutInMs` returns for Solana, so the timing
// assertions follow the validity window instead of a hardcoded magic number.
const SOLANA_TIMEOUT_MS = getTxValidityTimeoutInMs('solana');

const NOT_EXPIRED = { duration: { minutes: 0, seconds: 30 }, isPastDeadline: false };
const EXPIRED = { duration: { minutes: 0, seconds: 0 }, isPastDeadline: true };

describe('useTxValidityTimer', () => {
    let now: number;
    let mockHandleRetryClick: jest.Mock;

    const getBaseParams = (createdTimestamp: number): Params => ({
        networkType: 'solana',
        createdTimestamp,
        isBroadcasting: false,
        isTransactionAlreadySigned: false,
        onRetry: jest.fn(),
        onCancel: jest.fn(),
    });

    const renderTimer = async (overrides: Partial<Params> = {}) => {
        const initialProps = { ...getBaseParams(now), ...overrides };
        const view = await renderHook((props: Params) => useTxValidityTimer(props), {
            initialProps,
        });

        return { ...view, initialProps };
    };

    beforeEach(() => {
        jest.useFakeTimers();
        now = Date.now();

        mockUseCountdownTimer.mockReturnValue(NOT_EXPIRED);

        mockHandleRetryClick = jest.fn((fn: () => void) => fn());
        mockUseClickCooldown.mockReturnValue({
            handleClick: mockHandleRetryClick,
            disabled: false,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe('timer relevance', () => {
        it('should show the timer for a Solana transaction with a creation timestamp', async () => {
            const { result } = await renderTimer();

            expect(result.current.showTimer).toBe(true);
        });

        it.each(['ethereum', 'bitcoin', 'ripple'] as NetworkType[])(
            'should not show the timer for a %s transaction',
            async networkType => {
                const { result } = await renderTimer({ networkType });

                expect(result.current.showTimer).toBe(false);
            },
        );

        it('should not show the timer when the creation timestamp is missing', async () => {
            const { result } = await renderTimer({ createdTimestamp: 0 });

            expect(result.current.showTimer).toBe(false);
        });

        it('should not show the timer when the network type is unknown', async () => {
            const { result } = await renderTimer({ networkType: undefined });

            expect(result.current.showTimer).toBe(false);
        });
    });

    describe('countdown', () => {
        it('should derive the remaining seconds from the countdown duration', async () => {
            mockUseCountdownTimer.mockReturnValue({
                duration: { minutes: 1, seconds: 5 },
                isPastDeadline: false,
            });

            const { result } = await renderTimer();

            expect(result.current.secondsLeft).toBe(65);
        });

        it('should default the remaining seconds to zero for an empty duration', async () => {
            mockUseCountdownTimer.mockReturnValue({ duration: {}, isPastDeadline: false });

            const { result } = await renderTimer();

            expect(result.current.secondsLeft).toBe(0);
        });

        it('should pass the broadcasting flag through', async () => {
            const { result } = await renderTimer({ isBroadcasting: true });

            expect(result.current.isBroadcasting).toBe(true);
        });
    });

    describe('expiration', () => {
        it('should report past deadline when relevant, not broadcasting, and the countdown elapsed', async () => {
            mockUseCountdownTimer.mockReturnValue(EXPIRED);

            const { result } = await renderTimer();

            expect(result.current.isPastDeadline).toBe(true);
        });

        it('should not report past deadline while broadcasting', async () => {
            mockUseCountdownTimer.mockReturnValue(EXPIRED);

            const { result } = await renderTimer({ isBroadcasting: true });

            expect(result.current.isPastDeadline).toBe(false);
        });

        it('should not report past deadline when the timer is irrelevant', async () => {
            mockUseCountdownTimer.mockReturnValue(EXPIRED);

            const { result } = await renderTimer({ networkType: 'ethereum' });

            expect(result.current.isPastDeadline).toBe(false);
        });
    });

    describe('retry', () => {
        it('should route onRetry through the click cooldown', async () => {
            const onRetry = jest.fn();
            const { result } = await renderTimer({ onRetry });

            await act(() => {
                result.current.onRetry();
            });

            expect(mockHandleRetryClick).toHaveBeenCalledWith(onRetry);
            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('should reflect the cooldown disabled state', async () => {
            mockUseClickCooldown.mockReturnValue({
                handleClick: mockHandleRetryClick,
                disabled: true,
            });

            const { result } = await renderTimer();

            expect(result.current.isRetryDisabled).toBe(true);
        });
    });

    describe('expiration alert', () => {
        it('should show the expired alert once the transaction expires', async () => {
            mockUseCountdownTimer.mockReturnValue(EXPIRED);

            await renderTimer();

            expect(mockShowAlert).toHaveBeenCalledTimes(1);
            expect(mockShowAlert).toHaveBeenCalledWith(
                expect.objectContaining({ pictogramVariant: 'critical' }),
            );
        });

        it('should not show an alert while the transaction is still valid', async () => {
            mockUseCountdownTimer.mockReturnValue(NOT_EXPIRED);

            await renderTimer();

            expect(mockShowAlert).not.toHaveBeenCalled();
        });

        it('should not show an alert when expiry happens during broadcasting', async () => {
            mockUseCountdownTimer.mockReturnValue(EXPIRED);

            await renderTimer({ isBroadcasting: true });

            expect(mockShowAlert).not.toHaveBeenCalled();
        });

        it('should show the alert only once while it remains expired', async () => {
            mockUseCountdownTimer.mockReturnValue(EXPIRED);

            const { rerender, initialProps } = await renderTimer();
            await rerender(initialProps);

            expect(mockShowAlert).toHaveBeenCalledTimes(1);
        });

        it('should show the alert again after the transaction recovers and expires again', async () => {
            mockUseCountdownTimer.mockReturnValue(EXPIRED);
            const { rerender, initialProps } = await renderTimer();
            expect(mockShowAlert).toHaveBeenCalledTimes(1);

            mockUseCountdownTimer.mockReturnValue(NOT_EXPIRED);
            await rerender(initialProps);
            expect(mockShowAlert).toHaveBeenCalledTimes(1);

            mockUseCountdownTimer.mockReturnValue(EXPIRED);
            await rerender(initialProps);
            expect(mockShowAlert).toHaveBeenCalledTimes(2);
        });

        it('should wire the alert primary button to retry and the secondary button to cancel', async () => {
            const onRetry = jest.fn();
            const onCancel = jest.fn();
            mockUseCountdownTimer.mockReturnValue(EXPIRED);

            await renderTimer({ onRetry, onCancel });
            const alertConfig = mockShowAlert.mock.calls[0][0];

            await act(() => {
                alertConfig.onPressPrimaryButton();
            });
            expect(onRetry).toHaveBeenCalledTimes(1);

            await act(() => {
                alertConfig.onPressSecondaryButton();
            });
            expect(onCancel).toHaveBeenCalledTimes(1);
        });
    });

    describe('Trezor request cancellation', () => {
        it('should cancel the Trezor request once the validity window elapses', async () => {
            await renderTimer();

            expect(mockTrezorConnectCancel).not.toHaveBeenCalled();

            await act(() => {
                jest.advanceTimersByTime(1_000);
            });
            expect(mockTrezorConnectCancel).not.toHaveBeenCalled();

            await act(() => {
                jest.advanceTimersByTime(SOLANA_TIMEOUT_MS);
            });
            expect(mockTrezorConnectCancel).toHaveBeenCalledWith('tx-timeout');
        });

        it('should not schedule cancellation when the deadline has already passed', async () => {
            await renderTimer({ createdTimestamp: now - SOLANA_TIMEOUT_MS - 1_000 });

            await act(() => {
                jest.advanceTimersByTime(SOLANA_TIMEOUT_MS * 2);
            });

            expect(mockTrezorConnectCancel).not.toHaveBeenCalled();
        });

        const noCancelScenarios: { name: string; overrides: Partial<Params> }[] = [
            { name: 'while broadcasting', overrides: { isBroadcasting: true } },
            {
                name: 'when the transaction is already signed',
                overrides: { isTransactionAlreadySigned: true },
            },
            { name: 'for non-solana networks', overrides: { networkType: 'ethereum' } },
        ];

        it.each(noCancelScenarios)(
            'should not schedule cancellation $name',
            async ({ overrides }) => {
                await renderTimer(overrides);

                await act(() => {
                    jest.advanceTimersByTime(SOLANA_TIMEOUT_MS * 2);
                });

                expect(mockTrezorConnectCancel).not.toHaveBeenCalled();
            },
        );

        it('should clear the scheduled cancellation on unmount', async () => {
            const { unmount } = await renderTimer();

            await unmount();

            await act(() => {
                jest.advanceTimersByTime(SOLANA_TIMEOUT_MS * 2);
            });

            expect(mockTrezorConnectCancel).not.toHaveBeenCalled();
        });
    });
});
