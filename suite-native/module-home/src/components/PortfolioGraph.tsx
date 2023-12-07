import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { useGraphForAllDeviceAccounts, Graph, TimeSwitch } from '@suite-native/graph';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { VStack } from '@suite-native/atoms';
import { selectIsDeviceDiscoveryActive, selectIsPortfolioEmpty } from '@suite-common/wallet-core';
import { selectDiscoveryStartTimeStamp } from '@suite-native/discovery';

import {
    PortfolioGraphHeader,
    referencePointAtom,
    selectedPointAtom,
} from './PortfolioGraphHeader';

const DISCOVERY_LENGTH_CHECK_INTERVAL = 1000;
const DISCOVERY_DURATION_TRESHOLD = 10000;

export const PortfolioGraph = () => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);
    const startDiscoveryTimestamp = useSelector(selectDiscoveryStartTimeStamp);

    const [loadingTakesLongerThanExpected, setLoadingTakesLongerThanExpected] = useState(false);

    const { graphPoints, error, isLoading, refetch, onSelectTimeFrame, timeframe } =
        useGraphForAllDeviceAccounts({
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

    useEffect(() => {
        if (isDiscoveryActive && startDiscoveryTimestamp) {
            const interval = setInterval(() => {
                if (performance.now() - startDiscoveryTimestamp > DISCOVERY_DURATION_TRESHOLD) {
                    setLoadingTakesLongerThanExpected(true);
                    clearInterval(interval);
                }
            }, DISCOVERY_LENGTH_CHECK_INTERVAL);

            return () => clearInterval(interval);
        }
        setLoadingTakesLongerThanExpected(false);
    }, [isDiscoveryActive, startDiscoveryTimestamp]);

    useEffect(setInitialSelectedPoints, [setInitialSelectedPoints]);

    if (isPortfolioEmpty && isDiscoveryActive) return null;

    return (
        <VStack spacing="large">
            <PortfolioGraphHeader />
            <Graph
                points={graphPoints}
                loading={isLoading}
                loadingTakesLongerThanExpected={loadingTakesLongerThanExpected}
                onPointSelected={setSelectedPoint}
                onGestureEnd={setInitialSelectedPoints}
                onTryAgain={refetch}
                error={error}
            />
            <TimeSwitch selectedTimeFrame={timeframe} onSelectTimeFrame={onSelectTimeFrame} />
        </VStack>
    );
};
