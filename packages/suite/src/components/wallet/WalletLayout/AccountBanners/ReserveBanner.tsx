import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { getDisplaySymbol , selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { HELP_CENTER_XLM_URL, HELP_CENTER_XRP_URL } from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import type { Account } from 'src/types/wallet/index';

interface ReserveBannerProps {
    account: Account | undefined;
}

export const ReserveBanner = ({ account }: ReserveBannerProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
    let learnMoreUrl: string;

    switch (account?.networkType) {
        case 'ripple':
            learnMoreUrl = HELP_CENTER_XRP_URL;
            break;
        case 'stellar':
            learnMoreUrl = HELP_CENTER_XLM_URL;
            break;
        default:
            return null;
    }

    const bigBalance = new BigNumber(account.balance);
    const bigReserve = new BigNumber(account.misc.reserve);

    return bigBalance.isLessThan(bigReserve) ? (
        <Banner
            intent="warning"
            rightContent={
                <Banner.Button href={learnMoreUrl}>
                    <Translation id="TR_LEARN_MORE" />
                </Banner.Button>
            }
            description={
                <Translation
                    id="TR_RESERVE_INFO"
                    values={{
                        minBalance: formatNetworkAmount(
                            networkConfigDeps,
                            account.misc.reserve,
                            account.symbol,
                        ),
                        networkName: getNetworkConfig(account.symbol).name,
                        displaySymbol: getDisplaySymbol(networkConfigDeps, account.symbol),
                    }}
                />
            }
        />
    ) : null;
};
