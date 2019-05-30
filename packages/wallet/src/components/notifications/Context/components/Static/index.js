/* @flow */

import * as React from 'react';
import { Notification, Link } from 'trezor-ui-components';
import Bignumber from 'bignumber.js';
import { FormattedMessage } from 'react-intl';
import { withRouter } from 'react-router-dom';
import type { ContextRouter } from 'react-router';

import l10nCommonMessages from 'views/common.messages';
import { matchPath } from 'react-router';
import { getPattern } from 'support/routes';
import l10nMessages from './index.messages';
import type { Props } from '../../index';

export default withRouter<Props>((props: {| ...Props, ...ContextRouter |}) => {
    const { selectedAccount } = props;
    const { account } = selectedAccount;
    const { location } = props.router;
    const notifications = [];

    if (!location) return null;

    // Ripple minimum reserve notification
    if (selectedAccount && account && account.networkType === 'ripple') {
        const { reserve, balance } = account;
        const bigBalance = new Bignumber(balance);
        const bigReserve = new Bignumber(reserve);
        if (bigBalance.isLessThan(bigReserve)) {
            notifications.push(
                <Notification
                    key="xrp-warning"
                    variant="warning"
                    title={
                        <FormattedMessage {...l10nMessages.TR_MINIMUM_ACCOUNT_RESERVE_REQUIRED} />
                    }
                    message={
                        <>
                            <FormattedMessage
                                {...l10nMessages.TR_RIPPLE_ADDRESSES_REQUIRE_MINIMUM_BALANCE}
                                values={{
                                    minBalance: bigReserve.toString(),
                                    TR_LEARN_MORE: (
                                        <Link isGreen href="https://wiki.trezor.io/Ripple_(XRP)">
                                            <FormattedMessage
                                                {...l10nCommonMessages.TR_LEARN_MORE}
                                            />
                                        </Link>
                                    ),
                                }}
                            />
                        </>
                    }
                />
            );
        }
    }

    // Import tool notification
    if (matchPath(location.pathname, { path: getPattern('wallet-import') })) {
        notifications.push(
            <Notification
                key="import-warning"
                variant="warning"
                title="Use at your own risk"
                message="This is an advanced interface intended for developer use only. Never use this process unless you really know what you are doing."
            />
        );
    }

    if (account && account.imported) {
        notifications.push(
            <Notification
                key="watch-only-info"
                variant="info"
                title="The account is watch-only"
                message="A watch-only account is a public address you’ve imported into your wallet, allowing the wallet to watch for outputs but not spend them."
            />
        );
    }

    return <React.Fragment>{notifications}</React.Fragment>;
});
