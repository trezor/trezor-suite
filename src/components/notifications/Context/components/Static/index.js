/* @flow */

import * as React from 'react';
import Notification from 'components/Notification';
import Bignumber from 'bignumber.js';
import Link from 'components/Link';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';
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
                    title={(
                        <FormattedMessage {...l10nMessages.TR_MINIMUM_ACCOUNT_RESERVE_REQUIRED} />
                    )}
                    message={(
                        <>
                            <FormattedMessage
                                {...l10nMessages.TR_RIPPLE_ADDRESSES_REQUIRE_MINIMUM_BALANCE}
                                values={{
                                    minBalance: bigReserve.toString(),
                                    TR_LEARN_MORE: (
                                        <Link isGreen href="https://wiki.trezor.io/Ripple_(XRP)">
                                            <FormattedMessage {...l10nCommonMessages.TR_LEARN_MORE} />
                                        </Link>
                                    ),
                                }}
                            />
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