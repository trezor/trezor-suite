import {
    AssetFiatBalance,
    AssetFiatBalanceWithPercentage,
    calculateAssetsPercentage,
} from '@suite-common/assets';
import { SkeletonCircle, Tooltip } from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import styled from 'styled-components';
import { localizePercentage } from '@suite-common/wallet-utils';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { useSelector } from 'src/hooks/suite';
import { AssetShareIndicator } from '@trezor/product-components';
import { spacingsPx } from '@trezor/theme';

const LogoWrapper = styled.div`
    display: flex;
    padding-right: ${spacingsPx.md};
    align-items: center;
    justify-content: center;
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

type AssetCoinLogoSkeletonProps = {
    animate?: boolean;
};

export const AssetCoinLogoSkeleton = ({ animate }: AssetCoinLogoSkeletonProps) => (
    <LogoWrapper>
        <SkeletonCircle animate={animate} size={44} />
    </LogoWrapper>
);
