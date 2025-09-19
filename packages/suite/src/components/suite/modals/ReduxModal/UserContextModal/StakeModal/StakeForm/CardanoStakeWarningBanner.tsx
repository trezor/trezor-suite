import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

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
        <Banner variant="destructive" icon="warning">
            <Translation
                id="TR_STAKE_NOT_ENOUGH_FUNDS_WARNING"
                values={{
                    networkDisplaySymbol: getNetworkDisplaySymbol(symbol),
                }}
            />
        </Banner>
    );
};
