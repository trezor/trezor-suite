/* @flow */

import * as React from 'react';
import Notification from 'components/Notification';

import type { Props } from '../../index';

export default (props: Props) => {
    const { selectedAccount } = props;
    const { account } = selectedAccount;
    const { location } = props.router;
    const notifications: Array<Notification> = [];

    if (!location || !selectedAccount || !account) return null;

    // Ripple minimum reserve notification
    if (location.pathname.includes('xrp') && parseInt(account.balance, 10) < 20) {
        notifications.push(
            <Notification
                key="xrp-warning"
                type="warning"
                title="Minimum account reserve required"
                message="The Base Reserve is a minimum amount of XRP that is required for every address in the ledger. Currently, this is 20 XRP."
            />,
        );
    }

    return (
        <React.Fragment>
            {notifications}
        </React.Fragment>
    );
};