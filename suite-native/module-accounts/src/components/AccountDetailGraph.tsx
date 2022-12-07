import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { useAtom } from 'jotai';

import {
    useGraphForSingleAccount,
    EnhancedGraphPointWithCryptoBalance,
    enhanceGraphPoints,
    Graph,
    TimeSwitch,
} from '@suite-native/graph';
import { Box, Divider } from '@suite-native/atoms';
import { selectFiatCurrency } from '@suite-native/module-settings';

import { writeOnlyReferencePointAtom, writeOnlySelectedPointAtom } from './AccountBalance';

type AccountDetailGraphProps = {
    accountKey: string;
};

export const AccountDetailGraph = ({ accountKey }: AccountDetailGraphProps) => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { graphPoints, error, isLoading, refetch, setHoursToHistory, hoursToHistory } =
        useGraphForSingleAccount({
            accountKey,
            fiatCurrency: fiatCurrency.label,
        });
    const enhancedPoints = useMemo(
        () => enhanceGraphPoints(graphPoints) as EnhancedGraphPointWithCryptoBalance[],
        [graphPoints],
    );
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

    return (
        <Box>
            <Box marginBottom="large">
                <Graph<EnhancedGraphPointWithCryptoBalance>
                    onPointSelected={setSelectedPoint}
                    onGestureEnd={setInitialSelectedPoints}
                    points={enhancedPoints}
                    loading={isLoading}
                    error={error}
                    onTryAgain={refetch}
                />
                <TimeSwitch
                    selectedTimeFrame={hoursToHistory}
                    onSelectTimeFrame={setHoursToHistory}
                />
            </Box>
            <Box marginBottom="large">
                <Divider />
            </Box>
        </Box>
    );
};
