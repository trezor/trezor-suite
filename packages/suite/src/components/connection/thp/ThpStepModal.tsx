import { lazy } from 'react';

import { type TrezorDevice } from '@suite-common/suite-types';
import { type ThpAutoconnectStep, type ThpStep } from '@suite-common/thp';
import { exhaustive } from '@trezor/type-utils';

const ThpAutoconnectInfoModal = lazy(() =>
    import(/* webpackChunkName: "modals-connection" */ '@suite/thp').then(m => ({
        default: m.ThpAutoconnectInfoModal,
    })),
);
const ThpPairingFailedModal = lazy(() =>
    import(/* webpackChunkName: "modals-connection" */ '@suite/thp').then(m => ({
        default: m.ThpPairingFailedModal,
    })),
);
const ThpPairingPinEntryModal = lazy(() =>
    import(/* webpackChunkName: "modals-connection" */ '@suite/thp').then(m => ({
        default: m.ThpPairingPinEntryModal,
    })),
);
const ThpAutoconnectionModal = lazy(() =>
    import(/* webpackChunkName: "modals-connection" */ './ThpAutoconnectionModal').then(m => ({
        default: m.ThpAutoconnectionModal,
    })),
);
const ThpConnectionModal = lazy(() =>
    import(/* webpackChunkName: "modals-connection" */ './ThpConnectionModal').then(m => ({
        default: m.ThpConnectionModal,
    })),
);

type ThpStepModalProps = {
    device: TrezorDevice;
    thpStep: ThpStep;
    thpAutoconnectStep: ThpAutoconnectStep | null;
};

/** Picks the modal for the current THP step. Rendered inside the manager's Suspense boundary. */
export const ThpStepModal = ({ device, thpStep, thpAutoconnectStep }: ThpStepModalProps) => {
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
