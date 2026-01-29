import { TrezorDevice } from '@suite-common/suite-types';

import { ConfirmActionModal } from '../../../components/suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';

type ThpPairingConfirmStepParams = {
    device: TrezorDevice;
};

export const ThpPairingConfirmStep = ({ device }: ThpPairingConfirmStepParams) => (
    <ConfirmActionModal
        device={device}
        title="TR_THP_SECURELY_CONNECT_WITH_TREZOR"
        enableBackdropClick={false}
    />
);
