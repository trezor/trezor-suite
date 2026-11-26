import { type TrezorDevice } from '@suite-common/suite-types';
import { type ThpAutoconnectStep, type ThpStep } from '@suite-common/thp';
import { lazyComponentByName } from '@trezor/lazy-loading';
import { exhaustive } from '@trezor/type-utils';

const { LazyComponent: ThpAutoconnectInfoModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connection" */ '@suite/thp'),
    'ThpAutoconnectInfoModal',
);
const { LazyComponent: ThpPairingFailedModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connection" */ '@suite/thp'),
    'ThpPairingFailedModal',
);
const { LazyComponent: ThpPairingPinEntryModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connection" */ '@suite/thp'),
    'ThpPairingPinEntryModal',
);
const { LazyComponent: ThpAutoconnectionModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connection" */ './ThpAutoconnectionModal'),
    'ThpAutoconnectionModal',
);
const { LazyComponent: ThpConnectionModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-connection" */ './ThpConnectionModal'),
    'ThpConnectionModal',
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
