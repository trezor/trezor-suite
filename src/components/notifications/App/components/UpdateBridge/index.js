/* @flow */
import * as React from 'react';
import Notification from 'components/Notification';

import type { Props } from '../../index';

export default (props: Props) => {
    if (props.connect.transport && props.connect.transport.outdated) {
        return (
            <Notification
                key="update-bridge"
                type="warning"
                title="New Trezor Bridge is available"
                actions={
                    [{
                        label: 'Update',
                        callback: props.routerActions.gotoBridgeUpdate,
                    }]
                }
            />
        );
    }
    return null;
};