import {
    AssetFiatBalance,
    AssetFiatBalanceWithPercentage,
    calculateAssetsPercentage,
} from '@suite-common/assets';
import { AssetShareIndicator, SkeletonCircle } from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

const LogoWrapper = styled.div`
    padding-right: ${spacingsPx.sm};
    align-items: center;
`;

interface CoinLogoProps {
    symbol: NetworkSymbol;
    assetsFiatBalances?: AssetFiatBalance[];
    index?: number;
}

export const AssetCoinLogo = ({ symbol, assetsFiatBalances, index }: CoinLogoProps) => {
    const assetPercentage = assetsFiatBalances
        ? calculateAssetsPercentage(assetsFiatBalances).find(
              (asset: AssetFiatBalanceWithPercentage) => asset.symbol === symbol,
          )?.fiatPercentage
        : undefined;

    return (
        <LogoWrapper>
            <AssetShareIndicator
                symbol={symbol}
                size={24}
                percentageShare={assetPercentage}
                index={index}
            />
        </LogoWrapper>
    );
};

export const AssetCoinLogoSkeleton = () => (
    <LogoWrapper>
        <SkeletonCircle size={44} />
    </LogoWrapper>
);
