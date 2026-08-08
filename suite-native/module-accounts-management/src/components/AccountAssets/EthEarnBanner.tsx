import { Translation } from '@suite-native/intl';
import { EarnBanner } from './EarnBanner';
import { useNativeYieldVault, useStakingRate } from '@suite-native/module-earn';
import { Account } from '@suite-common/wallet-types';

interface EthEarnBannerProps {
    account: Account;
}

export const EthEarnBanner = ({ account }: EthEarnBannerProps) => {
    const nativeYieldVault = useNativeYieldVault({ account });
    const stakingRate = useStakingRate({ symbol: account.symbol, accountKey: account.key });

    const apy = Math.max(nativeYieldVault.bestVault?.apy ?? 0, stakingRate.rate ?? 0);
    const apyFormatted = apy.toFixed(2);

    return (
        <EarnBanner
            symbol={account.symbol}
            title={
                <Translation id="earn.promoStakeBanner.eth.title" values={{ apy: apyFormatted }} />
            }
            description={<Translation id="earn.promoStakeBanner.eth.description" />}
        />
    );
};
