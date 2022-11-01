import React from 'react';

import { format } from 'date-fns';
import { atom, useAtom } from 'jotai';

import { useFormatters } from '@suite-common/formatters';
import { Box, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { ExtendedGraphPoint, LineGraphPoint } from '@suite-common/wallet-graph';

// use atomic jotai structure for absolute minimum re-renders and maximum performance
// otherwise graph will be freezing on slower device while point swipe gesture
const selectedPointAtom = atom<ExtendedGraphPoint>({
    value: 0,
    date: new Date(),
    originalDate: new Date(),
});
// reference is usually first point, same as Revolut does in their app
const referencePointAtom = atom<ExtendedGraphPoint>({
    value: 0,
    date: new Date(),
    originalDate: new Date(),
});

export const writeOnlySelectedPointAtom = atom<null, ExtendedGraphPoint | LineGraphPoint>(
    null, // it's a convention to pass `null` for the first argument
    (_get, set, updatedPoint) => {
        // LineGraphPoint should never happen, but we need it to satisfy typescript because of originalDate
        set(selectedPointAtom, updatedPoint as ExtendedGraphPoint);
    },
);
export const writeOnlyReferencePointAtom = atom<null, ExtendedGraphPoint>(
    null,
    (_get, set, updatedPoint) => {
        set(referencePointAtom, updatedPoint);
    },
);

const percentageDiff = (a: number, b: number) => {
    if (a === 0 || b === 0) return 0;
    return 100 * ((b - a) / ((b + a) / 2));
};

const percentageChangeAtom = atom(get => {
    const selectedPoint = get(selectedPointAtom);
    const referencePoint = get(referencePointAtom);
    return percentageDiff(referencePoint.value, selectedPoint.value);
});

const Balance = () => {
    const { FiatAmountFormatter } = useFormatters();
    const [point] = useAtom(selectedPointAtom);

    return <FiatAmountFormatter value={point.value} />;
};

const getColorForPercentageChange = (percentageChange: number) =>
    percentageChange >= 0 ? 'forest' : 'red';

const PercentageChange = () => {
    const [percentageChange] = useAtom(percentageChangeAtom);

    return (
        <Text color={getColorForPercentageChange(percentageChange)} variant="hint">
            {percentageChange.toFixed(2)}%
        </Text>
    );
};

const PercentageChangeArrow = () => {
    const [percentageChange] = useAtom(percentageChangeAtom);

    const iconName: IconName = percentageChange >= 0 ? 'arrowUp' : 'arrowDown';

    return (
        <Icon
            name={iconName}
            color={getColorForPercentageChange(percentageChange)}
            size="extraSmall"
        />
    );
};

const Time = () => {
    const [point] = useAtom(selectedPointAtom);

    // TOOD: proper formatter, for example use just hours and minutes for small scales etc.
    return <>{format(point.originalDate, 'd. MMM k:mm')}</>;
};

const arrowStyle = prepareNativeStyle(() => ({
    marginRight: 4,
}));

export const PortfolioGraphHeader = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <>
            <Text variant="titleLarge">
                <Balance />
            </Text>
            <Box flexDirection="row" alignItems="center">
                <Box marginRight="small">
                    <Text variant="hint" color="gray600">
                        <Time />
                    </Text>
                </Box>
                <Box style={applyStyle(arrowStyle)}>
                    <PercentageChangeArrow />
                </Box>
                <PercentageChange />
            </Box>
        </>
    );
};
