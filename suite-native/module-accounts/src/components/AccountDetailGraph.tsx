import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { useSetAtom } from 'jotai';

import { useGraphForSingleAccount, Graph, TimeSwitch } from '@suite-native/graph';
import { Box } from '@suite-native/atoms';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { FiatGraphPointWithCryptoBalance } from '@suite-common/graph';

import { referencePointAtom, selectedPointAtom } from './AccountDetailGraphHeader';

type AccountDetailGraphProps = {
    accountKey: string;
};

export const AccountDetailGraph = ({ accountKey }: AccountDetailGraphProps) => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const {
        graphPoints,
        graphEvents,
        error,
        isLoading,
        refetch,
        setHoursToHistory,
        hoursToHistory,
    } = useGraphForSingleAccount({
        accountKey,
        fiatCurrency: fiatCurrency.label,
    });

    const setSelectedPoint = useSetAtom(selectedPointAtom);
    const setReferencePoint = useSetAtom(referencePointAtom);
    const lastPoint = A.last(graphPoints);
    const firstPoint = A.head(graphPoints);

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
                <Graph<FiatGraphPointWithCryptoBalance>
                    onPointSelected={setSelectedPoint}
                    onGestureEnd={setInitialSelectedPoints}
                    points={graphPoints}
                    loading={isLoading}
                    error={error}
                    onTryAgain={refetch}
                    events={graphEvents}
                />
                <TimeSwitch
                    selectedTimeFrame={hoursToHistory}
                    onSelectTimeFrame={setHoursToHistory}
                />
            </Box>
        </Box>
    );
};
