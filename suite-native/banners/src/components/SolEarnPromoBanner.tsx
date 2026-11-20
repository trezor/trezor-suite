import { useNetworkStakingRate } from '@suite-common/earn-staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { useFormattedEarnRate } from '@suite-native/earn';
import { Translation } from '@suite-native/intl';

import { EarnPromoBanner } from './EarnPromoBanner';

interface SolEarnPromoBannerProps {
    account: Account;
}

export const SolEarnPromoBanner = ({ account }: SolEarnPromoBannerProps) => {
    const stakingRate = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });

    const apyFormatted = useFormattedEarnRate(stakingRate.rate);

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    return (
        <EarnPromoBanner
            symbol={account.symbol}
            title={
                <Translation
                    id="earn.promoStakeBanner.title"
                    values={{ apy: apyFormatted, symbol: displaySymbol }}
                />
            }
            description={
                <Translation
                    id="earn.promoStakeBanner.sol.description"
                    values={{ symbol: displaySymbol }}
                />
            }
        />
    );
};
