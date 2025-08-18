import { TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

import { ConfirmActionModal } from '../suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';

type ThpConnectionModalProps = {
    device: TrezorDevice;
};

export const ThpConnectionModal = ({ device }: ThpConnectionModalProps) => {
    const onCancel = () => TrezorConnect.cancel();

    return (
        <ConfirmActionModal
            device={device}
            title="TR_THP_SECURELY_CONNECT_WITH_TREZOR"
            onCancel={onCancel}
            enableBackdropClick={false}
        />
    );
};
