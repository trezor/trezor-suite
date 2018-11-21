/* @flow */
import * as React from 'react';
import Notification from 'components/Notification';

import type { Props } from '../../index';

// There could be only one account notification
export default (props: Props) => {
    const { network, notification } = props.selectedAccount;
    if (network && notification.type && notification.title) {
        if (notification.type === 'backend') {
            // special case: backend is down
            // TODO: this is a different component with "auto resolve" button
            return (
                <Notification
                    type="error"
                    title={notification.title}
                    message={notification.message}
                    actions={
                        [{
                            label: 'Connect',
                            callback: async () => {
                                await props.blockchainReconnect(network.shortcut);
                            },
                        }]
                    }
                />
            );
        }
        return (
            <Notification
                type={notification.type}
                title={notification.title}
                message={notification.message}
            />
        );
    }

    return null;
};