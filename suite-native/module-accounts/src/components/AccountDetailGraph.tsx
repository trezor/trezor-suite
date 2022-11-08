import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Graph, TimeSwitch } from '@suite-native/graph';
import { GraphError } from '@suite-native/graph/src/components/GraphError';
import {
    enhanceGraphPoints,
    getSingleAccountGraphPointsThunk,
    LineGraphTimeFrameValues,
    selectAccountGraph,
} from '@suite-common/wallet-graph';
import { selectFiatCurrency } from '@suite-native/module-settings';

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

    const enhancedPoints = useMemo(() => enhanceGraphPoints(points), [points]);

    if (error) return <GraphError error={error} onTryAgain={handleFetchGraphPoints} />;

    return (
        <>
            <Graph points={enhancedPoints} loading={loading} />
            <TimeSwitch
                selectedTimeFrame={selectedTimeFrame}
                onSelectTimeFrame={handleSelectTimeFrame}
            />
        </>
    );
};
