import { useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';

import { DeviceDisconnectedStep } from 'src/views/onboarding/UnexpectedState/DeviceDisconnectedStep';

import { ThpCodeEntryStep } from './ThpCodeEntryStep';
import { ThpCodeInvalidStep } from './ThpCodeInvalidStep';
import { ThpPairingConfirmStep } from './ThpPairingConfirmStep';
import { ThpPairingStartStep } from './ThpPairingStartStep';

// reflection of suite/thp/src/firmware/ThpPairingStep.tsx
export const ThpPairingStep = () => {
    const device = useSelector(selectSelectedDevice);
    const thpStep = useSelector(selectThpStep);
    const prevStepRef = useRef(thpStep);
    if (thpStep) {
        prevStepRef.current = thpStep;
    }

    if (!device?.connected) {
        return <DeviceDisconnectedStep />;
    }

    // render thpState if set or last known step. fallback to ThpPairingStartStep with loader
    const step = thpStep ?? prevStepRef.current;
    switch (step) {
        case 'BeforeConnectionInfo':
            return <ThpPairingStartStep />;
        case 'ConfirmOnlyConnection':
        case 'ConfirmConnectionBeforePairing':
            return <ThpPairingConfirmStep device={device} />;
        case 'CodeEntry':
            return <ThpCodeEntryStep />;
        case 'CodeInvalid':
            return <ThpCodeInvalidStep />;

        default:
            return <ThpPairingStartStep isLoading />;
    }
};
