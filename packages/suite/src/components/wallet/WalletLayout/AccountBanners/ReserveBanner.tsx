import { getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { HELP_CENTER_XRP_URL, STELLAR_RESERVE_INFO_URL } from '@trezor/urls';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Translation } from 'src/components/suite';
import type { Account } from 'src/types/wallet/index';

interface ReserveBannerProps {
    account: Account | undefined;
}

export const ReserveBanner = ({ account }: ReserveBannerProps) => {
    let learnMoreUrl: string;

    switch (account?.networkType) {
        case 'ripple':
            learnMoreUrl = HELP_CENTER_XRP_URL;
            break;
        case 'stellar':
            learnMoreUrl = STELLAR_RESERVE_INFO_URL;
            break;
        default:
            return null;
    }

    const bigBalance = new BigNumber(account.balance);
    const bigReserve = new BigNumber(account.misc.reserve);

    return bigBalance.isLessThan(bigReserve) ? (
        <Banner
            variant="warning"
            rightContent={
                <Banner.Button href={learnMoreUrl}>
                    <Translation id="TR_LEARN_MORE" />
                </Banner.Button>
            }
        >
            <Translation
                id="TR_RESERVE_INFO"
                values={{
                    minBalance: formatNetworkAmount(account.misc.reserve, account.symbol),
                    networkName: getNetwork(account.symbol).name,
                    displaySymbol: getDisplaySymbol(account.symbol),
                }}
            />
        </Banner>
    ) : null;
};
