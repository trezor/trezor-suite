import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAtom } from 'jotai';

import { useGraphForAllAccounts } from '@suite-common/graph-neue';
import { enhanceGraphPoints, Graph, TimeSwitch } from '@suite-native/graph';
import { selectFiatCurrency } from '@suite-native/module-settings';

import {
    PortfolioGraphHeader,
    writeOnlyReferencePointAtom,
    writeOnlySelectedPointAtom,
} from './PortfolioGraphHeader';

export const PortfolioGraph = () => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { graphPoints, error, isLoading, refetch, setHoursToHistory, hoursToHistory } =
        useGraphForAllAccounts({
            fiatCurrency: fiatCurrency.label,
        });
    const enhancedPoints = useMemo(() => enhanceGraphPoints(graphPoints), [graphPoints]);
    const [_, setSelectedPoint] = useAtom(writeOnlySelectedPointAtom);
    const [__, setReferencePoint] = useAtom(writeOnlyReferencePointAtom);

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
