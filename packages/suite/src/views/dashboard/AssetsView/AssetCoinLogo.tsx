import {
    AssetFiatBalance,
    AssetFiatBalanceWithPercentage,
    calculateAssetsPercentage,
} from '@suite-common/assets';
import { SkeletonCircle, Tooltip } from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import { localizePercentage } from '@suite-common/wallet-utils';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { useSelector } from 'src/hooks/suite';
import { AssetShareIndicator } from '@trezor/product-components';

const LogoWrapper = styled.div`
    padding-right: ${spacingsPx.sm};
    align-items: center;
`;

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
        <LogoWrapper>
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
        </LogoWrapper>
    );
};

export const AssetCoinLogoSkeleton = () => (
    <LogoWrapper>
        <SkeletonCircle size={44} />
    </LogoWrapper>
);
