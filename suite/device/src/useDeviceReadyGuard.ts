import { useCallback, useEffect, useRef } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch, injectGetState } from '@trezor/redux-utils';

import { setConnectionModal, setConnectionMode } from './deviceSlice';
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

const isDeviceConnected = (device: TrezorDevice | undefined): device is TrezorDevice =>
    !!device?.connected && !!device.available;

export const useDeviceReadyGuard = ({
    onFailed,
    expectedWallet,
}: UseDeviceReadyGuardParams = {}) => {
    const { dispatch, getState } = useServices(injectDispatch, injectGetState);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
        };
    }, []);

    return useCallback(async (): Promise<boolean> => {
        const device = selectSelectedDevice(getState());
        if (!device?.connected || !device.available) {
            if (device?.descriptor?.apiType === 'bluetooth')
                dispatch(setConnectionMode('bluetooth'));
            dispatch(setConnectionModal(true));

            return false;
        }

        const connectedWallet = device.state?.staticSessionId;
        if (expectedWallet && connectedWallet && connectedWallet !== expectedWallet) {
            onFailed?.(WALLET_MISMATCH_ERROR);

            return false;
        }

        const session = await verifyDeviceSession(device);
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
            selected.path !== device.path ||
            selected.instance !== device.instance
        ) {
            onFailed?.(DEVICE_DISCONNECTED_ERROR);

            return false;
        }

        return true;
    }, [dispatch, expectedWallet, onFailed, getState]);
};
