import Bignumber from 'bignumber.js';
import { NotificationCard, Translation } from 'src/components/suite';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import type { Account } from 'src/types/wallet/index';
import { HELP_CENTER_XRP_URL } from '@trezor/urls';

interface XRPReserveProps {
    account: Account | undefined;
}

export const XRPReserve = ({ account }: XRPReserveProps) => {
    if (account?.networkType !== 'ripple') return null;
    const bigBalance = new Bignumber(account.balance);
    const bigReserve = new Bignumber(account.misc.reserve);

    return bigBalance.isLessThan(bigReserve) ? (
        <NotificationCard
            variant="warning"
            button={{
                children: <Translation id="TR_LEARN_MORE" />,
                href: HELP_CENTER_XRP_URL,
            }}
        >
            <Translation
                id="TR_XRP_RESERVE_INFO"
                values={{
                    minBalance: formatNetworkAmount(account.misc.reserve, 'xrp'),
                }}
            />
        </NotificationCard>
    ) : null;
};
