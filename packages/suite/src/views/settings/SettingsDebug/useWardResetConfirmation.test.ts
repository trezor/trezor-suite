import { act, renderHook } from '@testing-library/react';

import {
    WARD_RESET_CONFIRMATION_TIMEOUT_MS,
    useWardResetConfirmation,
} from './useWardResetConfirmation';

const DEVICE_A = 'device-a';
const DEVICE_B = 'device-b';

type ResetConfirmationProps = {
    deviceId: string | undefined;
};

const renderResetConfirmation = () => {
    const initialProps: ResetConfirmationProps = { deviceId: DEVICE_A };

    return renderHook(({ deviceId }) => useWardResetConfirmation(deviceId), { initialProps });
};

describe('useWardResetConfirmation', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('arms for the selected device until it is disarmed', () => {
        const { result } = renderResetConfirmation();

        act(() => result.current.arm());

        expect(result.current.isArmed).toBe(true);

        act(() => result.current.disarm());

        expect(result.current.isArmed).toBe(false);
    });

    it('lapses after the timeout', () => {
        const { result } = renderResetConfirmation();

        act(() => result.current.arm());
        act(() => jest.advanceTimersByTime(WARD_RESET_CONFIRMATION_TIMEOUT_MS));

        expect(result.current.isArmed).toBe(false);
    });

    it('does not confirm a reset of another device', () => {
        const { result, rerender } = renderResetConfirmation();

        act(() => result.current.arm());
        rerender({ deviceId: DEVICE_B });

        expect(result.current.isArmed).toBe(false);
    });

    it('cannot be armed without a device', () => {
        const { result, rerender } = renderResetConfirmation();

        rerender({ deviceId: undefined });
        act(() => result.current.arm());

        expect(result.current.isArmed).toBe(false);
    });
});
