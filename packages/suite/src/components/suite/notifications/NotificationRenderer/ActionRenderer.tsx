import { useDispatch } from '@suite-common/redux-utils';
import { acquireDevice, selectDeviceThunk } from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';

import type { NotificationRendererProps } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';
import type { NotificationViewProps } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';

type ActionRendererProps = NotificationViewProps & NotificationRendererProps;

export const ActionRenderer = ({ render: View, ...props }: ActionRendererProps) => {
    const dispatch = useDispatch();

    const { type, seen, device } = props.notification;

    let action: NotificationViewProps['action'];
    switch (type) {
        case DEVICE.CONNECT:
            action = {
                label: 'TR_SELECT_DEVICE',
                onClick: () => dispatch(selectDeviceThunk({ device })),
            };
            break;
        case DEVICE.CONNECT_UNACQUIRED:
            action = {
                label: 'TR_SOLVE_ISSUE',
                onClick: () => dispatch(acquireDevice({ requestedDevice: device })),
            };
            break;
        // no default
    }

    return <View {...props} action={!seen ? action : undefined} />;
};
