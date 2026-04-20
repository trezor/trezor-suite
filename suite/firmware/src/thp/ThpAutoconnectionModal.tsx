import { type TrezorDevice } from '@suite-common/suite-types';

import { ConfirmActionModal } from './ConfirmActionModal';

type ThpAutoconnectionModalProps = {
    device: TrezorDevice;
};

export const ThpAutoconnectionModal = ({ device }: ThpAutoconnectionModalProps) => (
    <ConfirmActionModal
        device={device}
        title="TR_THP_SECURELY_AUTOCONNECT_WITH_TREZOR"
        enableBackdropClick={false}
    />
);
