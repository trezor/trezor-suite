import { type Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { useStakingRate } from '@suite-native/module-earn';

import { EarnPromoBanner } from './EarnPromoBanner';

interface SolEarnPromoBannerProps {
    account: Account;
}

export const SolEarnPromoBanner = ({ account }: SolEarnPromoBannerProps) => {
    const stakingRate = useStakingRate({ symbol: account.symbol, accountKey: account.key });

    const apy = stakingRate.rate ?? 0;
    const apyFormatted = apy.toFixed(2);

    return (
        <EarnPromoBanner
            symbol={account.symbol}
            title={
                <Translation id="earn.promoStakeBanner.sol.title" values={{ apy: apyFormatted }} />
            }
            description={<Translation id="earn.promoStakeBanner.sol.description" />}
        />
    );
};
