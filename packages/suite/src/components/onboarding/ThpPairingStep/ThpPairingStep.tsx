import { selectSelectedDevice } from '@suite-common/device';
import { ThpStep } from '@suite-common/thp';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite/useSelector';
import { DeviceDisconnectedStep } from 'src/views/onboarding/UnexpectedState/DeviceDisconnectedStep';

import { ThpCodeEntryStep } from './ThpCodeEntryStep';
import { ThpCodeInvalidStep } from './ThpCodeInvalidStep';
import { ThpPairingConfirmStep } from './ThpPairingConfirmStep';
import { ThpPairingStartStep } from './ThpPairingStartStep';

// reflection of components/firmware/ThpPairingStep/ThpPairingStep.tsx
export const ThpPairingStep = ({ thpStep }: { thpStep: NonNullable<ThpStep> }) => {
    const device = useSelector(selectSelectedDevice);

    if (!device?.connected) {
        return <DeviceDisconnectedStep />;
    }

    switch (thpStep) {
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
            exhaustive(thpStep);
    }
};
