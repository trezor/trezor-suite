import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';

import { switchToConnectedDeviceThunk } from 'src/actions/suite/connectedDeviceToastThunks';

import { type NotificationRendererProps } from './NotificationRenderer';
import { type NotificationViewProps } from '../Notifications/NotificationGroup/NotificationList/NotificationView';

type DeviceConnectedRendererProps = NotificationRendererProps<'device-connected'>;

export const DeviceConnectedRenderer = ({
    render: View,
    notification,
}: DeviceConnectedRendererProps) => {
    const { dispatch } = useServices(injectDispatch);

    const { device, id, closed } = notification;

    const action: NotificationViewProps['action'] = {
        label: 'TOAST_DEVICE_CONNECTED_SWITCH',
        priority: 'primary',
        onClick: () => dispatch(switchToConnectedDeviceThunk({ device, notificationId: id })),
    };

    return (
        <View
            notification={notification}
            variant="info"
            message="TOAST_DEVICE_CONNECTED"
            messageValues={{ label: device.features?.label || device.name }}
            action={closed ? undefined : action}
        />
    );
};
