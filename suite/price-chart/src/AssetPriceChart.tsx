import { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';

import { selectAssetPriceChartRange } from '@suite/flags';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import { useAssetPriceHistoryQuery } from '@suite-common/price-chart';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { Skeleton } from '@trezor/components';

import { CHART_HEIGHT, ChartFrame } from './ChartFrame';

const AssetPriceGraph = lazy(() =>
    import('./AssetPriceGraph').then(module => ({ default: module.AssetPriceGraph })),
);

export type AssetPriceChartProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetPriceChart = ({ networkSymbol, tokenContract }: AssetPriceChartProps) => {
    const fiatCurrency = useSelector(selectBaseCurrency);
    const shouldAnimateSkeleton = useSelector(selectShouldAnimateLoadingSkeleton);
    const token = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );
    const range = useSelector(selectAssetPriceChartRange);
    const { data: points, isLoading } = useAssetPriceHistoryQuery({
        ticker: {
            symbol: networkSymbol,
            tokenAddress: tokenContract,
            protocols: isErc4626(token) ? ['erc4626'] : undefined,
        },
        fiatCurrency,
        range,
    });

    if (points === null) {
        return null;
    }

    const skeleton = (
        <ChartFrame data-testid="@price-chart/skeleton">
            <Skeleton width="100%" height={CHART_HEIGHT} animate={shouldAnimateSkeleton} />
        </ChartFrame>
    );

    if (isLoading || points === undefined) {
        return skeleton;
    }

    if (points.length === 0) {
        return null;
    }

    return (
        <Suspense fallback={skeleton}>
            <AssetPriceGraph points={points} />
        </Suspense>
    );
};
