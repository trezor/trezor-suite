import { BigNumber } from '@trezor/utils/src/bigNumber';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { HELP_CENTER_XRP_URL } from '@trezor/urls';
import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite';
import type { Account } from 'src/types/wallet/index';

interface XRPReserveProps {
    account: Account | undefined;
}

export const XRPReserve = ({ account }: XRPReserveProps) => {
    if (account?.networkType !== 'ripple') return null;
    const bigBalance = new BigNumber(account.balance);
    const bigReserve = new BigNumber(account.misc.reserve);

    return bigBalance.isLessThan(bigReserve) ? (
        <Banner
            variant="warning"
            rightContent={
                <Banner.Button href={HELP_CENTER_XRP_URL}>
                    <Translation id="TR_LEARN_MORE" />
                </Banner.Button>
            }
        >
            <Translation
                id="TR_XRP_RESERVE_INFO"
                values={{
                    minBalance: formatNetworkAmount(account.misc.reserve, 'xrp'),
                }}
            />
        </Banner>
    ) : null;
};
