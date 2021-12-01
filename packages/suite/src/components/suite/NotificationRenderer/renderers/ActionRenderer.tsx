import React from 'react';
import { DEVICE } from 'trezor-connect';
import { useActions } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
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
                onClick: () => (!seen ? selectDevice(device) : undefined),
            };
            break;
        case DEVICE.CONNECT_UNACQUIRED:
            action = {
                label: 'TR_SOLVE_ISSUE',
                onClick: () => (!seen ? acquireDevice(device) : undefined),
            };
            break;
        // no default
    }

    return <View {...props} action={action} />;
};

export default ActionRenderer;
