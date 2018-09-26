/* @flow */
import * as React from 'react';
import { Notification } from 'components/Notification';

import type { Props } from '../../index';

// There could be only one account notification
export default (props: Props) => {
    const { notification } = props.selectedAccount;
    if (notification) {
        if (notification.type === 'backend') {
            // special case: backend is down
            // TODO: this is a different component with "auto resolve" button
            /*
            return (
                <Notification
                    type="error"
                    title="Backend not connected"
                    actions={
                        [{
                            label: 'Try again',
                            callback: async () => {
                                await props.blockchainReconnect(network.network);
                            },
                        }]
                    }
                />
            );
            */
            return (<Notification type="error" title={notification.title} message={notification.message} />);
        }
        return (<Notification type={notification.type} title={notification.title} message={notification.message} />);
    }
    return null;
};