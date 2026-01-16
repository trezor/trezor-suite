import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';

type CardanoStakeWarningBannerProps = {
    account: Account;
    isCardanoStakingDisabled: boolean;
};

export const CardanoStakeWarningBanner = ({
    account,
    isCardanoStakingDisabled,
}: CardanoStakeWarningBannerProps) => {
    const { symbol } = account;

    if (!isCardanoStakingDisabled) return;

    return (
        <Banner
            intent="critical"
            icon="warning"
            description={
                <Translation
                    id="TR_STAKE_NOT_ENOUGH_FUNDS_WARNING"
                    values={{
                        networkDisplaySymbol: getNetworkDisplaySymbol(symbol),
                    }}
                />
            }
        />
    );
};
