import { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Skeleton } from '@trezor/components';

import { CHART_HEIGHT, ChartFrame } from './ChartFrame';
import { ChartNote } from './ChartNote';
import { useAssetPriceChartState } from './useAssetPriceChartState';

const AssetPriceGraph = lazy(() =>
    import('./AssetPriceGraph').then(module => ({ default: module.AssetPriceGraph })),
);

export type AssetPriceChartProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetPriceChart = ({ networkSymbol, tokenContract }: AssetPriceChartProps) => {
    const shouldAnimateSkeleton = useSelector(selectShouldAnimateLoadingSkeleton);
    const { points, isLoading, isError, isUnavailable, isEmpty } = useAssetPriceChartState({
        networkSymbol,
        tokenContract,
    });

    if (isUnavailable) {
        return null;
    }

    if (isError) {
        return (
            <ChartNote data-testid="@price-chart/error">
                <Translation id="TR_PRICE_CHART_LOAD_ERROR" />
            </ChartNote>
        );
    }

    if (isEmpty) {
        return (
            <ChartNote data-testid="@price-chart/empty">
                <Translation id="TR_PRICE_CHART_NO_HISTORY" />
            </ChartNote>
        );
    }

    const skeleton = (
        <ChartFrame data-testid="@price-chart/skeleton">
            <Skeleton width="100%" height={CHART_HEIGHT} animate={shouldAnimateSkeleton} />
        </ChartFrame>
    );

    if (isLoading || points === undefined || points === null) {
        return skeleton;
    }

    return (
        <Suspense fallback={skeleton}>
            <AssetPriceGraph points={points} />
        </Suspense>
    );
};
