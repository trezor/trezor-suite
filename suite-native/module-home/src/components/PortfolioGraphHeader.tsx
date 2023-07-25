import React from 'react';

import { atom, useAtomValue } from 'jotai';

import { Box, Text } from '@suite-native/atoms';
import { FiatAmountFormatter } from '@suite-native/formatters';
import {
    emptyGraphPoint,
    GraphDateFormatter,
    percentageDiff,
    PriceChangeIndicator,
} from '@suite-native/graph';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FiatGraphPoint } from '@suite-common/graph';

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

const headerStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.small,
}));

const dateAndPriceChangeContainerStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
}));

const Balance = () => {
    const point = useAtomValue(selectedPointAtom);

    return (
        <FiatAmountFormatter
            value={String(point.value)}
            variant="titleLarge"
            color="textDefault"
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    );
};

export const PortfolioGraphHeader = () => {
    const { applyStyle } = useNativeStyles();
    const { date: firstPointDate } = useAtomValue(referencePointAtom);

    return (
        <Box flexDirection="row" justifyContent="center" marginTop="large">
            <Box alignItems="center">
                <Text color="textSubdued" variant="hint" style={applyStyle(headerStyle)}>
                    My portfolio balance
                </Text>
                <Balance />
                <Box style={applyStyle(dateAndPriceChangeContainerStyle)}>
                    <Box marginRight="small">
                        <Text variant="hint" color="textSubdued">
                            <GraphDateFormatter
                                firstPointDate={firstPointDate}
                                selectedPointAtom={selectedPointAtom}
                            />
                        </Text>
                    </Box>
                    <PriceChangeIndicator
                        hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                        percentageChangeAtom={percentageChangeAtom}
                    />
                </Box>
            </Box>
        </Box>
    );
};
