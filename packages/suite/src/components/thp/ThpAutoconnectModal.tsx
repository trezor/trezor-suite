import { TrezorDevice } from '@suite-common/suite-types';

import { ConfirmActionModal } from '../suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';

interface ThpPairingModalModalProps {
    device: TrezorDevice;
}

export const ThpAutoconnectModal = ({ device }: ThpPairingModalModalProps) => (
    <ConfirmActionModal device={device} title="TR_THP_SECURELY_AUTOCONNECT_WITH_TREZOR" />
);
