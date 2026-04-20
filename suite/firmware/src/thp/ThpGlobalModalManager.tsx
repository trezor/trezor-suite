import { useSelector } from 'react-redux';

import { selectThpAutoconnectStep, selectThpStep } from '@suite-common/thp';
import { selectSelectedFirstThpDevice } from '@suite-common/wallet-core';
import { exhaustive } from '@trezor/type-utils';

import { ThpAutoconnectInfoModal } from './ThpAutoconnectInfoModal';
import { ThpAutoconnectionModal } from './ThpAutoconnectionModal';
import { ThpConnectionModal } from './ThpConnectionModal';
import { ThpPairingFailedModal } from './ThpPairingFailedModal';
import { ThpPairingPinEntryModal } from './ThpPairingPinEntryModal';

export const ThpGlobalModalManager = () => {
    const device = useSelector(selectSelectedFirstThpDevice);
    const thpStep = useSelector(selectThpStep);
    const thpAutoconnectStep = useSelector(selectThpAutoconnectStep);

    if (!device) {
        return null;
    }

    if (thpStep !== null) {
        switch (thpStep) {
            // handled in FirmwareModal and onboarding FirmwareStep
            case 'BeforeConnectionInfo':
                return null;
            case 'ConfirmConnectionBeforePairing':
                return <ThpConnectionModal device={device} />;
            case 'ConfirmOnlyConnection':
                return <ThpConnectionModal device={device} />;
            case 'CodeEntry':
                return <ThpPairingPinEntryModal />;
            case 'CodeInvalid':
                return <ThpPairingFailedModal />;
            default:
                return exhaustive(thpStep);
        }
    }

    if (thpAutoconnectStep === 'AutoconnectInfo') {
        return <ThpAutoconnectInfoModal device={device} />;
    }

    if (thpAutoconnectStep === 'Autoconnect') {
        return <ThpAutoconnectionModal device={device} />;
    }

    return null;
};
