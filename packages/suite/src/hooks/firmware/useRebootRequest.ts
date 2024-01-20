import { useState, useEffect } from 'react';

import { valid, satisfies } from 'semver';

import { rebootToBootloader } from '@suite-common/wallet-core';
import { getFirmwareVersion } from '@trezor/device-utils';

import type { TrezorDevice } from 'src/types/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { SUITE } from 'src/actions/suite/constants';

export type RebootRequestedMode = 'bootloader' | 'normal';
export type RebootPhase = 'initial' | 'wait-for-confirm' | 'disconnected' | 'done';
export type RebootMethod = 'automatic' | 'manual';
export type RebootRequest = {
    rebootMethod: RebootMethod;
    rebootPhase: RebootPhase;
};

export const useRebootRequest = (
    device: TrezorDevice | undefined,
    requestedMode: RebootRequestedMode,
): RebootRequest => {
    const [phase, setPhase] = useState<RebootPhase>('initial');

    // Default reboot method is 'manual'. If the device is connected when
    // the hook is first called and fw version is sufficient,
    // then the 'automatic' method is enabled.
    const [method, setMethod] = useState<RebootMethod>(() => {
        if (!device?.connected || !device?.features) return 'manual';

        const deviceFwVersion = getFirmwareVersion(device);

        return requestedMode === 'bootloader' &&
            valid(deviceFwVersion) &&
            satisfies(deviceFwVersion, '>=1.10.0 <2.0.0 || >=2.6.0')
            ? 'automatic'
            : 'manual';
    });

    const dispatch = useDispatch();
    const { mode, connected } = device || {};

    // todo: similar code in AddWalletButton component
    const locks = useSelector(state => state.suite.locks);
    const isLocked = !device || !device.connected || locks.includes(SUITE.LOCK_TYPE.DEVICE);

    // Sets current reboot phase based on previous phase, requested mode
    // and current device state.
    useEffect(() => {
        if (!connected) {
            // Device not connected, set 'disconnected' in all cases
            if (phase !== 'disconnected') setPhase('disconnected');
        } else if (mode === requestedMode) {
            // Requested mode was achieved, set 'done' in all cases
            if (phase !== 'done') setPhase('done');
        } else if (phase === 'disconnected' || phase === 'done') {
            // After reconnecting, requested mode was not achieved, so return to 'initial'
            setPhase('initial');
        } else if (phase === 'initial') {
            // If 'automatic' reboot available, send message to device and set 'wait-for-confirm',
            // else do nothing and wait for manual disconnection
            if (method === 'automatic') {
                if (isLocked) return;
                setPhase('wait-for-confirm');
                dispatch(rebootToBootloader())
                    .unwrap()
                    .then(res => {
                        if (!res?.success) {
                            // If automatic reboot wasn't successful, fallback to 'manual' and return to 'initial'
                            setMethod('manual');
                            setPhase('initial');
                        }
                    });
            }
        }
    }, [connected, mode, dispatch, phase, method, requestedMode, isLocked]);

    return {
        rebootMethod: method,
        rebootPhase: phase,
    };
};
