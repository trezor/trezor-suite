import * as React from 'react';
import { Notification } from '@trezor/components';
import { Link } from '@trezor/components-v2';
import Bignumber from 'bignumber.js';
import { FormattedMessage } from 'react-intl';

import globalMessages from '@suite-support/Messages';
import { getRoute } from '@suite-utils/router';
import l10nMessages from './index.messages';
import { AppState } from '@suite-types';

interface Props {
    router: AppState['router'];
}

export default (props: Props) => {
    // TODO
    // const { selectedAccount } = props;
    const selectedAccount = {
        account: {
            reserve: '20',
            balance: '0',
            networkType: 'fake',
            imported: false,
        },
    };

    const { pathname } = props.router;
    const { account } = selectedAccount;
    const notifications = [];

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
                                        // todo: add link to config urls
                                        <Link href="https://wiki.trezor.io/Ripple_(XRP)">
                                            <FormattedMessage
                                                {...globalMessages.TR_LEARN_MORE_LINK}
                                            />
                                        </Link>
                                    ),
                                }}
                            />
                        </>
                    }
                />,
            );
        }
    }

    // Import tool notification
    if (pathname === getRoute('wallet-import')) {
        notifications.push(
            <Notification
                key="import-warning"
                variant="warning"
                title="Use at your own risk"
                message="This is an advanced interface intended for developer use only. Never use this process unless you really know what you are doing."
            />,
        );
    }

    if (account && account.imported) {
        notifications.push(
            <Notification
                key="watch-only-info"
                variant="info"
                title="The account is watch-only"
                message="A watch-only account is a public address you’ve imported into your wallet, allowing the wallet to watch for outputs but not spend them."
            />,
        );
    }

    return <>{notifications}</>;
};
