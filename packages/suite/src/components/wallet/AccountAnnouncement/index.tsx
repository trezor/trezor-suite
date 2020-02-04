import * as React from 'react';
import { Notification } from '@trezor/components';
import { Link } from '@trezor/components-v2';
import Bignumber from 'bignumber.js';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { AppState } from '@suite-types';
import { URLS } from '@suite-constants';

interface Props {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

const Announcement = (props: Props) => {
    const { account } = props.selectedAccount;
    const notifications = [];

    // Ripple minimum reserve notification
    if (account && account.networkType === 'ripple') {
        const bigBalance = new Bignumber(account.availableBalance);
        const bigReserve = new Bignumber(account.misc.reserve);
        if (bigBalance.isLessThan(bigReserve)) {
            notifications.push(
                <Notification
                    key="xrp-warning"
                    variant="warning"
                    title={<Translation {...messages.TR_MINIMUM_ACCOUNT_RESERVE_REQUIRED} />}
                    message={
                        <>
                            <Translation
                                {...messages.TR_RIPPLE_ADDRESSES_REQUIRE_MINIMUM_BALANCE}
                                values={{
                                    minBalance: bigReserve.toString(),
                                    TR_LEARN_MORE: (
                                        <Link href={URLS.RIPPLE_MANUAL_URL}>
                                            <Translation {...messages.TR_LEARN_MORE_LINK} />
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

export default Announcement;
