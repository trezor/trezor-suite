import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useAtom } from 'jotai';

import {
    enhanceGraphPoints,
    getAllAccountsGraphPointsThunk,
    LineGraphTimeFrameValues,
    selectDashboardGraph,
} from '@suite-common/wallet-graph';
import { Box, Text } from '@suite-native/atoms';
import { enabledNetworks } from '@suite-native/config';
import { Graph, graphWrapperStyle, TimeSwitch } from '@suite-native/graph';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { useNativeStyles } from '@trezor/styles';

import {
    PortfolioGraphHeader,
    writeOnlyReferencePointAtom,
    writeOnlySelectedPointAtom,
} from './PortfolioGraphHeader';

export const PortfolioGraph = () => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { points, error, loading } = useSelector(selectDashboardGraph);
    const enhancedPoints = useMemo(() => enhanceGraphPoints(points), [points]);
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<LineGraphTimeFrameValues>('day');
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

    useEffect(() => {
        dispatch(
            getAllAccountsGraphPointsThunk({
                fiatCurrency: fiatCurrency.label,
                timeFrame: selectedTimeFrame,
                networkSymbols: enabledNetworks,
            }),
        );
    }, [selectedTimeFrame, fiatCurrency, dispatch]);

    const handleSelectTimeFrame = useCallback((timeFrame: LineGraphTimeFrameValues) => {
        setSelectedTimeFrame(timeFrame);
    }, []);

    return (
        <>
            <PortfolioGraphHeader />
            {error ? (
                <Box style={applyStyle(graphWrapperStyle)}>
                    <Text variant="label" color="gray600">
                        There are some troubles with loading graph points: {error}
                    </Text>
                </Box>
            ) : (
                <>
                    <Graph
                        points={enhancedPoints}
                        loading={loading}
                        onPointSelected={setSelectedPoint}
                        onGestureEnd={setInitialSelectedPoints}
                    />
                    <TimeSwitch
                        selectedTimeFrame={selectedTimeFrame}
                        onSelectTimeFrame={handleSelectTimeFrame}
                    />
                </>
            )}
        </>
    );
};
