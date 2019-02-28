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
        } else if (location.state.send) {
            notifications.push(
                <Notification
                    key="xrp-warning"
                    type="warning"
                    title="Do not send to accounts requiring a destination tag!"
                    message={(
                        <>
                            Destination tag is an arbitrary number which serves as a unique identifier of your transaction. Some services may require this to process your transaction. The current firmware version <strong>does not support</strong> destination tags yet.
                            <br /><br />
                            If the receiver requires a destination tag, do not use Trezor to send XRP. We are working on adding this feature.
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