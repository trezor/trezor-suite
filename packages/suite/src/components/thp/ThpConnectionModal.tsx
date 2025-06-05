import { TrezorDevice } from '@suite-common/suite-types';
import { thpActions } from '@suite-common/thp';

import { useDispatch } from '../../hooks/suite';
import { ConfirmActionModal } from '../suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';

type ThpConnectionModalProps = {
    device: TrezorDevice;
};

export const ThpConnectionModal = ({ device }: ThpConnectionModalProps) => {
    const dispatch = useDispatch();

    const onCancel = () => {
        dispatch(thpActions.resetThpFlow());
    };

    return (
        <ConfirmActionModal
            device={device}
            title="TR_THP_SECURELY_CONNECT_WITH_TREZOR"
            onCancel={onCancel}
        />
    );
};
