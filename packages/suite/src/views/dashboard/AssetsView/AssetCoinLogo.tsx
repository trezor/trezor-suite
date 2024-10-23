import {
    AssetFiatBalance,
    AssetFiatBalanceWithPercentage,
    calculateAssetsPercentage,
} from '@suite-common/assets';
import { Row, SkeletonCircle, Tooltip } from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { localizePercentage } from '@suite-common/wallet-utils';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { useSelector } from 'src/hooks/suite';
import { AssetShareIndicator } from '@trezor/product-components';

type AssetCoinLogoProps = {
    symbol: NetworkSymbol;
    assetsFiatBalances?: AssetFiatBalance[];
    index?: number;
};

export const AssetCoinLogo = ({ symbol, assetsFiatBalances, index }: AssetCoinLogoProps) => {
    const locale = useSelector(selectLanguage);

    const assetPercentage = assetsFiatBalances
        ? calculateAssetsPercentage(assetsFiatBalances).find(
              (asset: AssetFiatBalanceWithPercentage) => asset.symbol === symbol,
          )?.fiatPercentage
        : undefined;

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
        <SkeletonCircle animate={animate} size={44} />
    </Row>
);
