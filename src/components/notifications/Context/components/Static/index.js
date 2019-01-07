/* @flow */

import * as React from 'react';
import Notification from 'components/Notification';

import type { Props } from '../../index';

export default (props: Props) => {
    const { location } = props.router;
    if (!location) return null;

    const notifications: Array<Notification> = [];

    if (location.pathname.includes('xrp')) {
        notifications.push(
            <Notification
                key="example"
                type="warning"
                title="Minimum account reserve required"
                message="The Base Reserve is a minimum amount of XRP that is required for every address in the ledger. Currently, this is 20 XRP."
                cancelable
            />,
        );
    }

    return (
        <React.Fragment>
            {notifications}
        </React.Fragment>
    );
};