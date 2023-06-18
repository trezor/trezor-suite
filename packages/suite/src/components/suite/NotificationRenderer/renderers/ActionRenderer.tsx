import React from 'react';
import { DEVICE } from '@trezor/connect';
import { useActions } from 'src/hooks/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import type { NotificationViewProps, NotificationRendererProps } from '../types';

type ActionRendererProps = NotificationViewProps & NotificationRendererProps;

const ActionRenderer = ({ render: View, ...props }: ActionRendererProps) => {
    const { type, seen, device } = props.notification;

    const { selectDevice, acquireDevice } = useActions({
        selectDevice: suiteActions.selectDevice,
        acquireDevice: suiteActions.acquireDevice,
    });

    let action: NotificationViewProps['action'];
    switch (type) {
        case DEVICE.CONNECT:
            action = {
                label: 'TR_SELECT_DEVICE',
                onClick: () => selectDevice(device),
            };
            break;
        case DEVICE.CONNECT_UNACQUIRED:
            action = {
                label: 'TR_SOLVE_ISSUE',
                onClick: () => acquireDevice(device),
            };
            break;
        // no default
    }

    return <View {...props} action={!seen ? action : undefined} />;
};

export default ActionRenderer;
