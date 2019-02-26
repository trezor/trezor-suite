/* @flow */

import * as React from 'react';
import Notification from 'components/Notification';
import Bignumber from 'bignumber.js';
import Link from 'components/Link';
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
        if (bigBalance.isLessThan(bigReserve)) {
            notifications.push(
                <Notification
                    key="xrp-warning"
                    type="warning"
                    title="Minimum account reserve required"
                    message={(
                        <>
                            {`Ripple addresses require a minimum balance of ${bigReserve.toString()} XRP to activate and maintain the account. `}
                            <Link isGreen href="https://wiki.trezor.io/Ripple_(XRP)">Learn more</Link>
                        </>
                    )}
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