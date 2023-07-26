import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { useGraphForAllAccounts, Graph, TimeSwitch } from '@suite-native/graph';
import { selectFiatCurrency } from '@suite-native/module-settings';

import {
    PortfolioGraphHeader,
    referencePointAtom,
    selectedPointAtom,
} from './PortfolioGraphHeader';

export const PortfolioGraph = () => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { graphPoints, error, isLoading, refetch, onSelectTimeFrame, timeframe } =
        useGraphForAllAccounts({
            fiatCurrency: fiatCurrency.label,
        });
    const setSelectedPoint = useSetAtom(selectedPointAtom);
    const setReferencePoint = useSetAtom(referencePointAtom);

    const lastPoint = graphPoints[graphPoints.length - 1];
    const firstPoint = graphPoints[0];

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
                points={graphPoints}
                loading={isLoading}
                onPointSelected={setSelectedPoint}
                onGestureEnd={setInitialSelectedPoints}
                onTryAgain={refetch}
                error={error}
            />
            <TimeSwitch selectedTimeFrame={timeframe} onSelectTimeFrame={onSelectTimeFrame} />
        </>
    );
};
