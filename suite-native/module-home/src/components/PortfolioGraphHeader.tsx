import React from 'react';

import { atom, useAtomValue } from 'jotai';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { FiatAmountFormatter } from '@suite-native/formatters';
import {
    emptyGraphPoint,
    GraphDateFormatter,
    percentageDiff,
    PriceChangeIndicator,
} from '@suite-native/graph';
import { FiatGraphPoint } from '@suite-common/graph';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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

const fiatAmountStyle = prepareNativeStyle(utils => ({
    marginBottom: -utils.spacings.small,
}));

const Balance = () => {
    const point = useAtomValue(selectedPointAtom);
    const { applyStyle } = useNativeStyles();

    return (
        <FiatAmountFormatter
            style={applyStyle(fiatAmountStyle)}
            value={String(point.value)}
            variant="titleLarge"
            color="textDefault"
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    );
};

export const PortfolioGraphHeader = () => {
    const { date: firstPointDate } = useAtomValue(referencePointAtom);

    return (
        <Box>
            <VStack spacing="small" alignItems="center">
                <Text color="textSubdued" variant="hint">
                    My portfolio balance
                </Text>
                <Box justifyContent="center" alignItems="center">
                    <Balance />
                </Box>
                <HStack>
                    <GraphDateFormatter
                        firstPointDate={firstPointDate}
                        selectedPointAtom={selectedPointAtom}
                    />
                    <PriceChangeIndicator
                        hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                        percentageChangeAtom={percentageChangeAtom}
                    />
                </HStack>
            </VStack>
        </Box>
    );
};
