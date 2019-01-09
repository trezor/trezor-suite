/* @flow */

import * as React from 'react';
import Notification from 'components/Notification';
import Bignumber from 'bignumber.js';

import type { Props } from '../../index';

export default (props: Props) => {
    const { selectedAccount } = props;
    const { account } = selectedAccount;
    const { location } = props.router;
    const notifications: Array<Notification> = [];

    if (!location || !selectedAccount || !account) return null;

    // Ripple minimum reserve notification
    if (account.networkType === 'ripple') {
        const { reserve, balance } = account;
        const bigBalance = new Bignumber(balance);
        const bigReserve = new Bignumber(reserve);
        if (bigBalance.lessThan(bigReserve)) {
            notifications.push(
                <Notification
                    key="xrp-warning"
                    type="warning"
                    title="Minimum account reserve required"
                    message={`The Base Reserve is a minimum amount of XRP that is required for every address in the ledger. Currently, this is ${bigReserve.toString()} XRP.`}
                />,
            );
        }
    }

    return (
        <React.Fragment>
            {notifications}
        </React.Fragment>
    );
};