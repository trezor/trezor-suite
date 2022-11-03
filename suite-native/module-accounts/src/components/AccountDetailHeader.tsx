import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Graph, TimeSwitch } from '@suite-native/graph';
import { AccountBalance } from '@suite-native/accounts';
import { Box, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/suite-types';
import {
    enhanceGraphPoints,
    getSingleAccountGraphPointsThunk,
    LineGraphTimeFrameValues,
    selectAccountGraph,
} from '@suite-common/wallet-graph';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { GraphError } from '@suite-native/graph/src/components/GraphError';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
    accountName?: string;
};

export const AccountDetailHeader = memo(({ accountKey, accountName }: AccountDetailHeaderProps) => {
    const dispatch = useDispatch();
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { points, error, loading } = useSelector(selectAccountGraph);
    const enhancedPoints = useMemo(() => enhanceGraphPoints(points), [points]);

    const [selectedTimeFrame, setSelectedTimeFrame] = useState<LineGraphTimeFrameValues>('day');

    const handleFetchGraphPoints = useCallback(() => {
        dispatch(
            getSingleAccountGraphPointsThunk({
                accountKey,
                fiatCurrency: fiatCurrency.label,
                timeFrame: selectedTimeFrame,
            }),
        );
    }, [selectedTimeFrame, fiatCurrency, accountKey, dispatch]);

    useEffect(() => {
        handleFetchGraphPoints();
    }, [handleFetchGraphPoints]);

    const handleSelectTimeFrame = (timeFrame: LineGraphTimeFrameValues) => {
        setSelectedTimeFrame(timeFrame);
    };

    return (
        <>
            <AccountBalance accountKey={accountKey} accountName={accountName} />
            {error ? (
                <GraphError error={error} onTryAgain={handleFetchGraphPoints} />
            ) : (
                <>
                    <Graph points={enhancedPoints} loading={loading} />
                </>
            )}
            <TimeSwitch
                selectedTimeFrame={selectedTimeFrame}
                onSelectTimeFrame={handleSelectTimeFrame}
            />
            <Box marginBottom="large">
                <Text variant="titleSmall">Transactions</Text>
            </Box>
        </>
    );
});
