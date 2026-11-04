import { useFormatters } from '@suite-common/formatters';
import {
    type NetworkSymbol,
    PROD_STAKING_SYMBOLS,
    asNetworkSymbol,
} from '@suite-common/wallet-config';
import { Badge } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useAssetYieldRate } from '../hooks/useAssetYieldRate';
import { upToYieldRateTranslationIds } from '../utils/getYieldRateLabelType';

const prodStakingNetworkSymbols = PROD_STAKING_SYMBOLS.map(asNetworkSymbol);

const badgeStyle = prepareNativeStyle(utils => ({
    flexShrink: 0,
    paddingHorizontal: utils.spacings.sp8,
}));

type AssetYieldRateBadgeProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: string;
    tokenSymbol?: string | null;
    tokenDecimals?: number;
};

/** The best rate an asset can earn across all accounts holding it, e.g. `up to 6.42% APY`. */
export const AssetYieldRateBadge = ({
    networkSymbol,
    contractAddress,
    tokenSymbol,
    tokenDecimals,
}: AssetYieldRateBadgeProps) => {
    const { applyStyle } = useNativeStyles();
    const { PercentageFormatter } = useFormatters();

    const yieldRate = useAssetYieldRate({
        networkSymbol,
        token:
            contractAddress === undefined
                ? undefined
                : {
                      contract: contractAddress,
                      symbol: tokenSymbol ?? undefined,
                      decimals: tokenDecimals ?? 0,
                  },
        variant: 'inactive',
        stakingSymbols: prodStakingNetworkSymbols,
    });

    if (!yieldRate) {
        return null;
    }

    return (
        <Badge
            intent="brand"
            size="small"
            style={applyStyle(badgeStyle)}
            label={
                <Translation
                    id={upToYieldRateTranslationIds[yieldRate.labelType]}
                    values={{ value: PercentageFormatter.format(yieldRate.apy) }}
                />
            }
            testID="@earn/asset-yield-rate-badge"
        />
    );
};
