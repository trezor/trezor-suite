import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type TrezorDevice } from '@suite-common/suite-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectIsConnectionModalOpen } from './deviceSelectors';
import { setConnectionModal, setConnectionMode } from './deviceSlice';
import { useDevice } from './useDevice';
import { verifyDeviceSession } from './verifyDeviceSession';

export type DeviceSessionError = {
    code: string | undefined;
    message: string;
};

type UseDeviceReadyGuardParams = {
    onFailed?: (error: DeviceSessionError) => void;
};

type ResolveConnection = (device: TrezorDevice | undefined) => void;

const isDeviceConnected = (device: TrezorDevice | undefined): device is TrezorDevice =>
    !!device?.connected && !!device.available;

/**
 * Check to run before an action that signs on the device. It asks for a missing device, waits
 * until it is connected and verifies the wallet session, so the PIN and passphrase prompts finish
 * before the action starts.
 */
export const useDeviceReadyGuard = ({ onFailed }: UseDeviceReadyGuardParams = {}) => {
    const { dispatch } = useServices(injectDispatch);
    const { device } = useDevice();
    const isConnectionModalOpen = useSelector(selectIsConnectionModalOpen);
    const resolveConnectionRef = useRef<ResolveConnection | null>(null);

    // The connection modal closes when a device connects or when the user dismisses it.
    useEffect(() => {
        if (!isConnectionModalOpen) {
            resolveConnectionRef.current?.(device);
            resolveConnectionRef.current = null;
        }
    }, [isConnectionModalOpen, device]);

    useEffect(
        () => () => {
            resolveConnectionRef.current?.(undefined);
            resolveConnectionRef.current = null;
        },
        [],
    );

    const requestConnection = useCallback(() => {
        if (device?.descriptor?.apiType === 'bluetooth') {
            dispatch(setConnectionMode('bluetooth'));
        }

        dispatch(setConnectionModal(true));

        return new Promise<TrezorDevice | undefined>(resolve => {
            resolveConnectionRef.current?.(undefined);
            resolveConnectionRef.current = resolve;
        });
    }, [device, dispatch]);

    return useCallback(async (): Promise<boolean> => {
        const connectedDevice = isDeviceConnected(device) ? device : await requestConnection();

        if (!isDeviceConnected(connectedDevice)) {
            return false;
        }

        const session = await verifyDeviceSession(connectedDevice);

        if (session.status === 'failed') {
            onFailed?.({ code: session.code, message: session.message });
        }

        return session.status === 'verified';
    }, [device, requestConnection, onFailed]);
};
