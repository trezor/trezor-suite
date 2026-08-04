import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol , selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

type CardanoStakeWarningBannerProps = {
    account: Account;
    isCardanoStakingDisabled: boolean;
};

export const CardanoStakeWarningBanner = ({
    account,
    isCardanoStakingDisabled,
}: CardanoStakeWarningBannerProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { symbol } = account;

    if (!isCardanoStakingDisabled) return;

    return (
        <Banner
            intent="critical"
            icon={WarningIcon}
            description={
                <Translation
                    id="TR_STAKE_NOT_ENOUGH_FUNDS_WARNING"
                    values={{
                        networkDisplaySymbol: getNetworkDisplaySymbol(networkConfigDeps, symbol),
                    }}
                />
            }
        />
    );
};
