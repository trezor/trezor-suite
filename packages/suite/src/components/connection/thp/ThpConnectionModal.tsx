import { EventType } from '@suite-common/analytics-types';
import { TrezorDevice } from '@suite-common/suite-types';
import { thpActions } from '@suite-common/thp';

import { useDispatch } from 'src/hooks/suite';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

import { ConfirmActionModal } from '../../suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';

type ThpConnectionModalProps = {
    device: TrezorDevice;
};

export const ThpConnectionModal = ({ device }: ThpConnectionModalProps) => {
    const dispatch = useDispatch();
    const legacyAnalytics = useLegacyAnalytics();
    const onCancel = () => {
        legacyAnalytics.report({
            type: EventType.DeviceConnectionDeviceConfirmation,
            payload: {
                option: 'close',
            },
        });
        dispatch(thpActions.finishThpFlow());
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
