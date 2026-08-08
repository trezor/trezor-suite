import { type Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { useNativeYieldVault, useStakingRate } from '@suite-native/module-earn';

import { EarnPromoBanner } from './EarnPromoBanner';

interface EthEarnPromoBannerProps {
    account: Account;
}

export const EthEarnPromoBanner = ({ account }: EthEarnPromoBannerProps) => {
    const nativeYieldVault = useNativeYieldVault({ account });
    const stakingRate = useStakingRate({ symbol: account.symbol, accountKey: account.key });

    const apy = Math.max(nativeYieldVault.bestVault?.apy ?? 0, stakingRate.rate ?? 0);
    const apyFormatted = apy.toFixed(2);

    return (
        <EarnPromoBanner
            symbol={account.symbol}
            title={
                <Translation id="earn.promoStakeBanner.eth.title" values={{ apy: apyFormatted }} />
            }
            description={<Translation id="earn.promoStakeBanner.eth.description" />}
        />
    );
};
