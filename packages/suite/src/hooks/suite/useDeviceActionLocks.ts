import { useState, useEffect } from 'react';
import { SUITE } from '@suite-actions/constants';
import { useSelector } from '@suite-hooks';

/**
 * React hook that returns array with 2 items.
 * First item is boolean indicating whether we can make a call to the device.
 * Second item is an object describing conditions that were not satisfied (device disconnected, locks,...).
 *
 * @returns
 */
export const useDeviceActionLocks = () => {
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
        if (!device?.connected || uiLocked || deviceLocked) {
            setIsEnabled(false);
        } else {
            setIsEnabled(true);
        }
        setStatus({
            deviceDisconnected: !device?.connected,
            deviceLocked,
            uiLocked,
        });
        return () => {};
    }, [device, deviceLocked, uiLocked]);

    return [isEnabled, status];
};
