import { Translation } from '@suite-native/intl';
import { EarnBanner } from './EarnBanner';
import { Account } from '@suite-common/wallet-types';
import { useStakingRate } from '@suite-native/module-earn';

interface SolEarnBannerProps {
    account: Account;
}

export const SolEarnBanner = ({ account }: SolEarnBannerProps) => {
    const stakingRate = useStakingRate({ symbol: account.symbol, accountKey: account.key });

    const apy = stakingRate.rate ?? 0;
    const apyFormatted = apy.toFixed(2);

    return (
        <EarnBanner
            symbol={account.symbol}
            title={
                <Translation id="earn.promoStakeBanner.sol.title" values={{ apy: apyFormatted }} />
            }
            description={<Translation id="earn.promoStakeBanner.sol.description" />}
        />
    );
};
