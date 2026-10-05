import { useEffect, useState } from 'react';

export const WARD_RESET_CONFIRMATION_TIMEOUT_MS = 5000;

/**
 * The second click that confirms retiring the WARD app role. A first click arms the confirmation
 * for the selected device only, and it lapses after a few seconds or when the caller disarms it,
 * so a click much later, or on another device, never resets with a single click.
 */
export const useWardResetConfirmation = (deviceId: string | undefined) => {
    const [armedDeviceId, setArmedDeviceId] = useState<string | undefined>();
    const isArmed = armedDeviceId !== undefined && armedDeviceId === deviceId;

    useEffect(() => {
        if (armedDeviceId === undefined) {
            return;
        }

        const timeout = setTimeout(
            () => setArmedDeviceId(undefined),
            WARD_RESET_CONFIRMATION_TIMEOUT_MS,
        );

        return () => clearTimeout(timeout);
    }, [armedDeviceId]);

    const arm = () => setArmedDeviceId(deviceId);
    const disarm = () => setArmedDeviceId(undefined);

    return { isArmed, arm, disarm };
};
