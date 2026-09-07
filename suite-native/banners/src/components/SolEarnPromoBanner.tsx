import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
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
