import { useSelector } from 'react-redux';

import { atom, useAtomValue } from 'jotai';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { FiatBalanceFormatter } from '@suite-native/formatters';
import {
    emptyGraphPoint,
    GraphDateFormatter,
    percentageDiff,
    PriceChangeIndicator,
} from '@suite-native/graph';
import { FiatGraphPoint } from '@suite-common/graph';
import { Translation } from '@suite-native/intl';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';

// use atomic jotai structure for absolute minimum re-renders and maximum performance
// otherwise graph will be freezing on slower device while point swipe gesture
export const selectedPointAtom = atom<FiatGraphPoint>(emptyGraphPoint);

// reference is usually first point, same as Revolut does in their app
export const referencePointAtom = atom<FiatGraphPoint>(emptyGraphPoint);

const percentageChangeAtom = atom(get => {
    const selectedPoint = get(selectedPointAtom);
    const referencePoint = get(referencePointAtom);
    return percentageDiff(referencePoint.value, selectedPoint.value);
});

const hasPriceIncreasedAtom = atom(get => {
    const percentageChange = get(percentageChangeAtom);
    return percentageChange >= 0;
});

const Balance = () => {
    const point = useAtomValue(selectedPointAtom);
    const fiatValue = String(point.value);

    return <FiatBalanceFormatter value={fiatValue} />;
};

export const PortfolioGraphHeader = () => {
    const { date: firstPointDate } = useAtomValue(referencePointAtom);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    return (
        <Box>
            <VStack spacing="xs" alignItems="center">
                <Text color="textSubdued" variant="hint">
                    <Translation id="moduleHome.graph.title" />
                </Text>
                {!isDiscoveryActive && (
                    <>
                        <Box justifyContent="center" alignItems="center">
                            <Balance />
                        </Box>
                        <HStack alignItems="center">
                            <GraphDateFormatter
                                firstPointDate={firstPointDate}
                                selectedPointAtom={selectedPointAtom}
                            />
                            <PriceChangeIndicator
                                hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                                percentageChangeAtom={percentageChangeAtom}
                            />
                        </HStack>
                    </>
                )}
            </VStack>
        </Box>
    );
};
