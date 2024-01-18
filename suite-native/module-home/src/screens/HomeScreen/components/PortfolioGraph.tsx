import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { useGraphForAllDeviceAccounts, Graph, TimeSwitch } from '@suite-native/graph';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { VStack } from '@suite-native/atoms';
import {
    selectIsDeviceDiscoveryActive,
    selectIsDeviceDiscoveryEmpty,
} from '@suite-common/wallet-core';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';

import {
    PortfolioGraphHeader,
    referencePointAtom,
    selectedPointAtom,
} from './PortfolioGraphHeader';

export type PortfolioGraphRef = {
    refetch: () => Promise<void>;
};

export const PortfolioGraph = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const fiatCurrency = useSelector(selectFiatCurrency);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const isDeviceDiscoveryEmpty = useSelector(selectIsDeviceDiscoveryEmpty);

    const loadingTakesLongerThanExpected = useIsDiscoveryDurationTooLong();

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

    useEffect(setInitialSelectedPoints, [setInitialSelectedPoints]);

    useImperativeHandle(
        ref,
        () => ({
            refetch,
        }),
        [refetch],
    );

    if (isDeviceDiscoveryEmpty && isDiscoveryActive) return null;

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
});
