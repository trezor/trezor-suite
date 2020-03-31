import { useState, useEffect } from 'react';
import { useSelector as useReduxSelector, TypedUseSelectorHook } from 'react-redux';
import { AppState } from '@suite-types';
import { SUITE } from '@suite/actions/suite/constants';

export const useSelector: TypedUseSelectorHook<AppState> = useReduxSelector;

export const useTrezorActionEnabled = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [status, setStatus] = useState<{
        deviceDisconnected: boolean;
        deviceLocked: boolean;
        uiLocked: boolean;
    }>({ deviceDisconnected: false, deviceLocked: false, uiLocked: false });
    const device = useSelector(state => state.suite.device);
    const locks = useSelector(state => state.suite.locks);
    const deviceLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE);
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.UI);

    useEffect(() => {
        if (device?.connected || uiLocked || deviceLocked) {
            setIsEnabled(true);
            setStatus({
                deviceDisconnected: true,
                deviceLocked,
                uiLocked,
            });
        } else {
            setIsEnabled(false);
            setStatus({
                deviceDisconnected: false,
                deviceLocked: false,
                uiLocked: false,
            });
        }
        return () => {};
    }, [device, deviceLocked, uiLocked]);

    return [isEnabled, status];
};
