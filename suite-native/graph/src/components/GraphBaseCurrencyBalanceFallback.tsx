import { type Atom } from 'jotai';

import { useFormatters } from '@suite-common/formatters';
import { type FiatGraphPoint } from '@suite-common/graph';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { GraphBaseCurrencyBalanceAmount } from './GraphBaseCurrencyBalanceAmount';

type GraphBaseCurrencyBalanceFallbackProps<TGraphPoint extends FiatGraphPoint> = {
    selectedPointAtom: Atom<TGraphPoint | null>;
    isGestureActiveAtom: Atom<boolean>;
    showChange: boolean;
    totalBaseCurrencyBalance?: BaseCurrencyAmount;
};

const wrapperStyle = prepareNativeStyle(_ => ({
    height: 72,
    alignItems: 'center',
}));

export const GraphBaseCurrencyBalanceFallback = <TGraphPoint extends FiatGraphPoint>({
    selectedPointAtom,
    isGestureActiveAtom,
    showChange,
    totalBaseCurrencyBalance,
}: GraphBaseCurrencyBalanceFallbackProps<TGraphPoint>) => {
    const { applyStyle } = useNativeStyles();
    const { DateTimeFormatter } = useFormatters();

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <GraphBaseCurrencyBalanceAmount
                selectedPointAtom={selectedPointAtom}
                isGestureActiveAtom={isGestureActiveAtom}
                totalBaseCurrencyBalance={totalBaseCurrencyBalance}
            />
            {showChange && (
                <HStack alignItems="center">
                    {/* Empty space to prevent layout shift. */}
                    <Text variant="body-sm" color="contentSecondary">
                        <DateTimeFormatter value={new Date()} />
                    </Text>
                </HStack>
            )}
        </Box>
    );
};
