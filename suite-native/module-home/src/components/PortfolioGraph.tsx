import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { useGraphForAllAccounts, enhanceGraphPoints, Graph, TimeSwitch } from '@suite-native/graph';
import { selectFiatCurrency } from '@suite-native/module-settings';

import {
    PortfolioGraphHeader,
    referencePointAtom,
    selectedPointAtom,
} from './PortfolioGraphHeader';

export const PortfolioGraph = () => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { graphPoints, error, isLoading, refetch, setHoursToHistory, hoursToHistory } =
        useGraphForAllAccounts({
            fiatCurrency: fiatCurrency.label,
        });
    const enhancedPoints = useMemo(() => enhanceGraphPoints(graphPoints), [graphPoints]);
    const setSelectedPoint = useSetAtom(selectedPointAtom);
    const setReferencePoint = useSetAtom(referencePointAtom);

    const lastPoint = enhancedPoints[enhancedPoints.length - 1];
    const firstPoint = enhancedPoints[0];

    const setInitialSelectedPoints = useCallback(() => {
        if (lastPoint && firstPoint) {
            setSelectedPoint(lastPoint);
            setReferencePoint(firstPoint);
        }
    }, [lastPoint, firstPoint, setSelectedPoint, setReferencePoint]);

    useEffect(setInitialSelectedPoints, [setInitialSelectedPoints]);

    return (
        <>
            <PortfolioGraphHeader />

            <Graph
                points={enhancedPoints}
                loading={isLoading}
                onPointSelected={setSelectedPoint}
                onGestureEnd={setInitialSelectedPoints}
                onTryAgain={refetch}
                error={error}
            />
            <TimeSwitch selectedTimeFrame={hoursToHistory} onSelectTimeFrame={setHoursToHistory} />
        </>
    );
};
