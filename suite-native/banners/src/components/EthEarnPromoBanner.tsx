import { useNativeYieldVault } from '@suite-common/earn-stablecoin';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { useFormattedEarnRate, useStakingRate } from '@suite-native/module-earn';

import { EarnPromoBanner } from './EarnPromoBanner';

interface EthEarnPromoBannerProps {
    account: Account;
}

export const EthEarnPromoBanner = ({ account }: EthEarnPromoBannerProps) => {
    const nativeYieldVault = useNativeYieldVault({ account });
    const stakingRate = useStakingRate({ symbol: account.symbol, accountKey: account.key });

    const yieldApy = nativeYieldVault.bestVault?.apy;
    const stakingApy = stakingRate.rate;

    const apy = yieldApy || stakingApy ? Math.max(yieldApy ?? 0, stakingApy ?? 0) : null;
    const apyFormatted = useFormattedEarnRate(apy);

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
                    id="earn.promoStakeBanner.eth.description"
                    values={{ symbol: displaySymbol }}
                />
            }
        />
    );
};
