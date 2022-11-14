import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { useAtom } from 'jotai';

import { Graph, TimeSwitch, GraphError } from '@suite-native/graph';
import {
    enhanceGraphPoints,
    getSingleAccountGraphPointsThunk,
    LineGraphTimeFrameValues,
    selectAccountGraph,
} from '@suite-common/wallet-graph';
import { writeOnlySelectedPointAtom, writeOnlyReferencePointAtom } from '@suite-native/accounts';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { Box, Divider } from '@suite-native/atoms';

type AccountDetailGraphProps = {
    accountKey: string;
};

export const AccountDetailGraph = ({ accountKey }: AccountDetailGraphProps) => {
    const dispatch = useDispatch();
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<LineGraphTimeFrameValues>('day');

    const handleSelectTimeFrame = (timeFrame: LineGraphTimeFrameValues) => {
        setSelectedTimeFrame(timeFrame);
    };
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { points, error, loading } = useSelector(selectAccountGraph);
    const enhancedPoints = useMemo(() => enhanceGraphPoints(points), [points]);
    const [_, setSelectedPoint] = useAtom(writeOnlySelectedPointAtom);
    const [__, setReferencePoint] = useAtom(writeOnlyReferencePointAtom);

    const lastPoint = A.last(enhancedPoints);
    const firstPoint = A.head(enhancedPoints);

    const setInitialSelectedPoints = useCallback(() => {
        if (lastPoint && firstPoint) {
            setSelectedPoint(lastPoint);
            setReferencePoint(firstPoint);
        }
    }, [lastPoint, firstPoint, setSelectedPoint, setReferencePoint]);

    useEffect(setInitialSelectedPoints, [setInitialSelectedPoints]);

    const handleFetchGraphPoints = useCallback(() => {
        dispatch(
            getSingleAccountGraphPointsThunk({
                accountKey,
                fiatCurrency: fiatCurrency.label,
                timeFrame: selectedTimeFrame,
            }),
        );
    }, [dispatch, accountKey, fiatCurrency.label, selectedTimeFrame]);

    useEffect(() => {
        handleFetchGraphPoints();
    }, [handleFetchGraphPoints]);

    if (error) return <GraphError error={error} onTryAgain={handleFetchGraphPoints} />;

    return (
        <Box>
            <Box marginBottom="large">
                <Graph
                    onPointSelected={setSelectedPoint}
                    onGestureEnd={setInitialSelectedPoints}
                    points={enhancedPoints}
                    loading={loading}
                />
                <TimeSwitch
                    selectedTimeFrame={selectedTimeFrame}
                    onSelectTimeFrame={handleSelectTimeFrame}
                />
            </Box>
            <Box marginBottom="large">
                <Divider />
            </Box>
        </Box>
    );
};
