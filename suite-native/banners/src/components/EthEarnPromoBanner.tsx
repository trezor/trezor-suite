import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { useNativeYieldVault } from '@suite-common/earn-stablecoin';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { useStakingRate } from '@suite-native/module-earn';

import { EarnPromoBanner } from './EarnPromoBanner';

interface EthEarnPromoBannerProps {
    account: Account;
}

export const EthEarnPromoBanner = ({ account }: EthEarnPromoBannerProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const nativeYieldVault = useNativeYieldVault({ account });
    const stakingRate = useStakingRate({ symbol: account.symbol, accountKey: account.key });

    const apy = Math.max(nativeYieldVault.bestVault?.apy ?? 0, stakingRate.rate ?? 0);
    const apyFormatted = apy.toFixed(2);
    const displaySymbol = getNetworkDisplaySymbol(networkConfigDeps, account.symbol);

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
