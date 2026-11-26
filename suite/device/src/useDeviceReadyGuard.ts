import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch, injectGetState } from '@trezor/redux-utils';

import { selectIsConnectionModalOpen } from './deviceSelectors';
import { setConnectionModal, setConnectionMode } from './deviceSlice';
import { useDevice } from './useDevice';
import { verifyDeviceSession } from './verifyDeviceSession';

export type DeviceSessionError = {
    code: string | undefined;
    message: string;
};

export const WALLET_MISMATCH_ERROR_CODE = 'Wallet_Mismatch';

const WALLET_MISMATCH_ERROR: DeviceSessionError = {
    code: WALLET_MISMATCH_ERROR_CODE,
    message: 'The selected wallet does not own the account',
};

const DEVICE_DISCONNECTED_ERROR: DeviceSessionError = {
    code: 'Device_Disconnected',
    message: 'Device disconnected',
};

type UseDeviceReadyGuardParams = {
    expectedWallet?: string;
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
export const useDeviceReadyGuard = ({
    onFailed,
    expectedWallet,
}: UseDeviceReadyGuardParams = {}) => {
    const { dispatch, getState } = useServices(injectDispatch, injectGetState);
    const { device } = useDevice();
    const isConnectionModalOpen = useSelector(selectIsConnectionModalOpen);
    const resolveConnectionRef = useRef<ResolveConnection | null>(null);
    const mounted = useRef(false);

    // The connection modal closes when a device connects or when the user dismisses it.
    useEffect(() => {
        if (!isConnectionModalOpen) {
            resolveConnectionRef.current?.(device);
            resolveConnectionRef.current = null;
        }
    }, [isConnectionModalOpen, device]);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
            resolveConnectionRef.current?.(undefined);
            resolveConnectionRef.current = null;
        };
    }, []);

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

        if (!mounted.current || !isDeviceConnected(connectedDevice)) {
            return false;
        }

        const connectedWallet = connectedDevice.state?.staticSessionId;
        if (expectedWallet && connectedWallet && connectedWallet !== expectedWallet) {
            onFailed?.(WALLET_MISMATCH_ERROR);

            return false;
        }

        const session = await verifyDeviceSession(connectedDevice);
        if (!mounted.current) return false;

        if (session.status !== 'verified') {
            if (session.status === 'failed') {
                onFailed?.({ code: session.code, message: session.message });
            }

            return false;
        }

        const selected = selectSelectedDevice(getState());

        if (
            isDeviceConnected(selected) &&
            selected.state?.staticSessionId !== (expectedWallet ?? connectedWallet)
        ) {
            onFailed?.(WALLET_MISMATCH_ERROR);

            return false;
        }

        if (
            !isDeviceConnected(selected) ||
            selected.path !== connectedDevice.path ||
            selected.instance !== connectedDevice.instance
        ) {
            onFailed?.(DEVICE_DISCONNECTED_ERROR);

            return false;
        }

        return true;
    }, [device, requestConnection, expectedWallet, onFailed, getState]);
};
