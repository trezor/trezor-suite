import { TrezorDevice } from '@suite-common/suite-types';
import { thpActions } from '@suite-common/thp';
import TrezorConnect from '@trezor/connect';

import { useDispatch } from 'src/hooks/suite';

import { ConfirmActionModal } from '../suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';

type ThpConnectionModalProps = {
    device: TrezorDevice;
};

export const ThpConnectionModal = ({ device }: ThpConnectionModalProps) => {
    const dispatch = useDispatch();

    const onCancel = () => {
        TrezorConnect.cancel();
        dispatch(thpActions.resetThpFlow());
    };

    return (
        <ConfirmActionModal
            device={device}
            title="TR_THP_SECURELY_CONNECT_WITH_TREZOR"
            onCancel={onCancel}
            enableBackdropClick={false}
        />
    );
};
