import { type Account } from '@suite-common/wallet-types';
import { AssetSymbol } from '@suite-native/assets';
import { useFormattedEarnRate, useStakingRate } from '@suite-native/earn';
import { Translation } from '@suite-native/intl';

import { EarnPromoBanner } from './EarnPromoBanner';

interface SolEarnPromoBannerProps {
    account: Account;
}

export const SolEarnPromoBanner = ({ account }: SolEarnPromoBannerProps) => {
    const stakingRate = useStakingRate({ symbol: account.symbol, accountKey: account.key });

    const apyFormatted = useFormattedEarnRate(stakingRate.rate);

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
                    id="earn.promoStakeBanner.sol.description"
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
        />
    );
};
