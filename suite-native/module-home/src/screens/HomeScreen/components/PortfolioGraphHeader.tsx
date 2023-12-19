import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { FiatBalanceFormatter } from '@suite-native/formatters';
import { GraphDateFormatter, percentageDiff, PriceChangeIndicator } from '@suite-native/graph';
import { FiatGraphPoint, FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { Translation } from '@suite-native/intl';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';

const emptyGraphPoint: FiatGraphPointWithCryptoBalance = {
    value: 0,
    date: new Date(0),
    cryptoBalance: '0',
};

// use atomic jotai structure for absolute minimum re-renders and maximum performance
// otherwise graph will be freezing on slower device while point swipe gesture
export const selectedPointAtom = atom<FiatGraphPoint>(emptyGraphPoint);

// reference is usually first point, same as Revolut does in their app
export const referencePointAtom = atom<FiatGraphPoint | null>(null);

const percentageChangeAtom = atom(get => {
    const selectedPoint = get(selectedPointAtom);
    const referencePoint = get(referencePointAtom);

    if (!referencePoint) return 0;

    return percentageDiff(referencePoint.value, selectedPoint.value);
});

const hasPriceIncreasedAtom = atom(get => {
    const percentageChange = get(percentageChangeAtom);
    return percentageChange >= 0;
});

const Balance = () => {
    const point = useAtomValue(selectedPointAtom);
    const fiatValue = String(point.value);
    const setPoint = useSetAtom(selectedPointAtom);

    // Reset selected point on unmount so it doesn't display on device change
    useEffect(() => () => setPoint(emptyGraphPoint), [setPoint]);

    return <FiatBalanceFormatter value={fiatValue} />;
};

export const PortfolioGraphHeader = () => {
    const firstGraphPoint = useAtomValue(referencePointAtom);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    return (
        <Box>
            <VStack spacing="extraSmall" alignItems="center">
                <Text color="textSubdued" variant="hint">
                    <Translation id="moduleHome.graph.title" />
                </Text>
                {!isDiscoveryActive && (
                    <>
                        <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                            <Balance />
                        </Box>
                        <HStack alignItems="center">
                            {firstGraphPoint ? (
                                <>
                                    <GraphDateFormatter
                                        firstPointDate={firstGraphPoint.date}
                                        selectedPointAtom={selectedPointAtom}
                                    />
                                    <PriceChangeIndicator
                                        hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                                        percentageChangeAtom={percentageChangeAtom}
                                    />
                                </>
                            ) : (
                                <Text>{' ' /* just placeholder to avoid layout shift */}</Text>
                            )}
                        </HStack>
                    </>
                )}
            </VStack>
        </Box>
    );
};
