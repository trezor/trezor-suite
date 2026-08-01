import { selectLanguage } from '@suite/settings';
import {
    type AssetFiatBalance,
    type AssetFiatBalanceWithPercentage,
    calculateAssetsPercentage,
} from '@suite-common/assets';
import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { localizePercentage } from '@suite-common/wallet-utils';
import { Row, Skeleton, Tooltip } from '@trezor/components';
import { AssetShareIndicator } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

type AssetCoinLogoProps = {
    symbol: NetworkSymbol;
    assetsFiatBalances?: AssetFiatBalance[];
    index?: number;
};

export const AssetCoinLogo = ({ symbol, assetsFiatBalances, index }: AssetCoinLogoProps) => {
    const locale = useSelector(selectLanguage);
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);

    const assetPercentage = assetsFiatBalances
        ? calculateAssetsPercentage(assetsFiatBalances).find(
              (asset: AssetFiatBalanceWithPercentage) => asset.symbol === symbol,
          )?.fiatPercentage
        : undefined;
    const { color: networkColor } = getNetworkConfig(symbol);

    return (
        <Row justifyContent="center">
            <Tooltip
                content={localizePercentage({
                    valueInFraction: (assetPercentage ?? 0) / 100,
                    locale,
                    numDecimals: 2,
                })}
                cursor="pointer"
            >
                <AssetShareIndicator
                    symbol={symbol}
                    networkColor={networkColor}
                    size={24}
                    percentageShare={assetPercentage}
                    index={index}
                />
            </Tooltip>
        </Row>
    );
};

type AssetCoinLogoSkeletonProps = {
    animate?: boolean;
};

export const AssetCoinLogoSkeleton = ({ animate }: AssetCoinLogoSkeletonProps) => (
    <Row alignItems="center" justifyContent="center">
        <Skeleton type="circle" animate={animate} size={44} />
    </Row>
);
