import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectDevicesCount } from '@suite-common/device';

import {
    selectActiveTransports,
    selectIsTransportInitialized,
} from 'src/selectors/suite/suiteSelectors';

const INITIAL_DEVICES_TIMEOUT_MS = 10_000;

export const useWaitForTransport = (): boolean => {
    const isTransportInitialized = useSelector(selectIsTransportInitialized);
    const hasDevice = useSelector(selectDevicesCount) > 0;
    const activeTransports = useSelector(selectActiveTransports);
    const expectsDevice = activeTransports.some(transport => !!transport.initialDeviceCount);

    const [waitingFinished, setWaitingFinished] = useState(false);

    // Once finished, it never waits again, e.g. after a later device disconnect or transport restart.
    useEffect(() => {
        // No transport yet or finished already, nothing to do.
        if (!isTransportInitialized || waitingFinished) return;

        // If we have a device or don't expect any, finish waiting immediately.
        if (hasDevice || !expectsDevice) {
            setWaitingFinished(true);

            return;
        }

        // Otherwise set maximum waiting timeout (which can still be beaten by immediate end).
        const timeout = setTimeout(() => setWaitingFinished(true), INITIAL_DEVICES_TIMEOUT_MS);

        return () => clearTimeout(timeout);
    }, [isTransportInitialized, expectsDevice, hasDevice, waitingFinished]);

    return !waitingFinished;
};
