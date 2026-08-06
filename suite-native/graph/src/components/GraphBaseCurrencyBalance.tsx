import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type Atom } from 'jotai';

import { type FiatGraphPoint } from '@suite-common/graph';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

import { GraphBaseCurrencyBalanceContent } from './GraphBaseCurrencyBalanceContent';
import { GraphBaseCurrencyBalanceFallback } from './GraphBaseCurrencyBalanceFallback';
import { GraphBaseCurrencyBalanceSkeleton } from './GraphBaseCurrencyBalanceSkeleton';

type GraphFiatBalanceProps<TGraphPoint extends FiatGraphPoint = FiatGraphPoint> = {
    points: TGraphPoint[];
    selectedPointAtom: Atom<TGraphPoint | null>;
    isGestureActiveAtom: Atom<boolean>;
    showChange?: boolean;
    isLoading?: boolean;
    totalBaseCurrencyBalance?: BaseCurrencyAmount;
    isHistoryEnabledAccount?: boolean;
};

const getReferencePoint = <TGraphPoint extends FiatGraphPoint>(points: TGraphPoint[]) =>
    points.find(point => point.value > 0) ?? points[0] ?? null;

export const GraphBaseCurrencyBalance = <TGraphPoint extends FiatGraphPoint>({
    points,
    selectedPointAtom,
    isGestureActiveAtom,
    showChange = true,
    isLoading = false,
    totalBaseCurrencyBalance,
    isHistoryEnabledAccount = true,
}: GraphFiatBalanceProps<TGraphPoint>) => {
    const firstGraphPoint = useMemo(() => getReferencePoint(points), [points]);
    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
    const hasBalance = Number(totalBaseCurrencyBalance) !== 0;
    const showLoading = isLoading || !firstGraphPoint;
    const showBalanceFallback =
        !hasDeviceDiscovery && ((hasBalance && showLoading) || !isHistoryEnabledAccount);

    if (showBalanceFallback) {
        return (
            <GraphBaseCurrencyBalanceFallback
                selectedPointAtom={selectedPointAtom}
                isGestureActiveAtom={isGestureActiveAtom}
                showChange={showChange}
                totalBaseCurrencyBalance={totalBaseCurrencyBalance}
            />
        );
    }

    if (showLoading) {
        return <GraphBaseCurrencyBalanceSkeleton />;
    }

    return (
        <GraphBaseCurrencyBalanceContent
            points={points}
            firstGraphPoint={firstGraphPoint}
            selectedPointAtom={selectedPointAtom}
            isGestureActiveAtom={isGestureActiveAtom}
            showChange={showChange}
            totalBaseCurrencyBalance={totalBaseCurrencyBalance}
        />
    );
};
