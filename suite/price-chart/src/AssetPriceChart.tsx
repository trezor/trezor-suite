import { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { type TokenAddress } from '@suite-common/tokens';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { Button, Skeleton } from '@trezor/components';
import { ArrowsClockwiseIcon } from '@trezor/icons';

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
    const { points, isLoading, isError, isFetching, refetch, isUnavailable, isEmpty } =
        useAssetPriceChartState({ networkSymbol, tokenContract });

    if (isUnavailable) {
        return null;
    }

    const skeleton = (
        <ChartFrame data-testid="@price-chart/skeleton">
            <Skeleton width="100%" height={CHART_HEIGHT} animate={shouldAnimateSkeleton} />
        </ChartFrame>
    );

    if (isError && isFetching) {
        return skeleton;
    }

    if (isError) {
        return (
            <ChartNote
                data-testid="@price-chart/error"
                action={
                    <Button
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        iconLeft={ArrowsClockwiseIcon}
                        onClick={() => refetch()}
                        data-testid="@price-chart/refresh"
                    >
                        <Translation id="REFRESH" />
                    </Button>
                }
            >
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

    if (isLoading || points === undefined || points === null) {
        return skeleton;
    }

    return (
        <Suspense fallback={skeleton}>
            <AssetPriceGraph points={points} />
        </Suspense>
    );
};
