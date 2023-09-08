import { acquireDevice, selectDeviceThunk } from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';

import { useDispatch } from 'src/hooks/suite';

import type { NotificationViewProps, NotificationRendererProps } from '../types';

type ActionRendererProps = NotificationViewProps & NotificationRendererProps;

const ActionRenderer = ({ render: View, ...props }: ActionRendererProps) => {
    const dispatch = useDispatch();

    const { type, seen, device } = props.notification;

    let action: NotificationViewProps['action'];
    switch (type) {
        case DEVICE.CONNECT:
            action = {
                label: 'TR_SELECT_DEVICE',
                onClick: () => dispatch(selectDeviceThunk(device)),
            };
            break;
        case DEVICE.CONNECT_UNACQUIRED:
            action = {
                label: 'TR_SOLVE_ISSUE',
                onClick: () => dispatch(acquireDevice(device)),
            };
            break;
        // no default
    }

    return <View {...props} action={!seen ? action : undefined} />;
};

export default ActionRenderer;
