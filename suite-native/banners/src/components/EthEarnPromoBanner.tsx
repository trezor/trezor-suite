import { useNativeYieldVault } from '@suite-common/earn-stablecoin';
import { useNetworkStakingRate } from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { AssetSymbol } from '@suite-native/assets';
import { useFormattedEarnRate } from '@suite-native/earn';
import { Translation } from '@suite-native/intl';

import { EarnPromoBanner } from './EarnPromoBanner';

interface EthEarnPromoBannerProps {
    account: Account;
    onExplore?: () => void;
}

export const EthEarnPromoBanner = ({ account, onExplore }: EthEarnPromoBannerProps) => {
    const nativeYieldVault = useNativeYieldVault({ account });
    const stakingRate = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });

    const yieldApy = nativeYieldVault.bestVault?.apy;
    const stakingApy = stakingRate.rate;

    const apy = yieldApy || stakingApy ? Math.max(yieldApy ?? 0, stakingApy ?? 0) : null;
    const apyFormatted = useFormattedEarnRate(apy);

    return (
        <EarnPromoBanner
            symbol={account.symbol}
            title={
                <Translation
                    id="earn.promoStakeBanner.title"
                    values={{
                        apy: apyFormatted,
                        symbol: <AssetSymbol networkSymbol={account.symbol} color="contentBrand" />,
                    }}
                />
            }
            description={
                <Translation
                    id="earn.promoStakeBanner.eth.description"
                    values={{
                        symbol: (
                            <AssetSymbol
                                networkSymbol={account.symbol}
                                variant="body-sm"
                                color="contentBrand"
                            />
                        ),
                    }}
                />
            }
            onExplore={onExplore}
        />
    );
};
