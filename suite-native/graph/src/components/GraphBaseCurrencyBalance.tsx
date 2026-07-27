import { useSelector } from 'react-redux';

import { type Atom, useAtomValue } from 'jotai';

import { useFormatters } from '@suite-common/formatters';
import { type FiatGraphPoint } from '@suite-common/graph';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, BoxSkeleton, DiscreetTextTrigger, HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountLargeFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

import { GraphDateFormatter } from './GraphDateFormatter';
import { PriceChangeIndicator } from './PriceChangeIndicator';

type GraphFiatBalanceProps = {
    selectedPointFiatValueAtom: Atom<string>;
    selectedPointTimestampAtom: Atom<number | null>;
    referencePointAtom: Atom<FiatGraphPoint | null>;
    percentageChangeAtom: Atom<number>;
    isGestureActiveAtom: Atom<boolean>;
    showChange?: boolean;
    isLoading?: boolean;
    totalBaseCurrencyBalance?: BaseCurrencyAmount;
    isHistoryEnabledAccount?: boolean;
};

const wrapperStyle = prepareNativeStyle(_ => ({
    height: 72, // Hardcoded because of some margin magic in FiatBalanceFormatter.
    alignItems: 'center',
}));

const Skeleton = () => (
    <VStack alignItems="center" spacing="sp8">
        <BoxSkeleton elevation="0" width={180} height={44} />
        <BoxSkeleton elevation="0" width={140} height={20} />
    </VStack>
);

const FormattedBalance = ({ value }: { value: BaseCurrencyAmount }) => (
    <DiscreetTextTrigger testID="@home/portfolio/fiat-balance-header/discreet-trigger">
        <BaseCurrencyAmountLargeFormatter
            value={value}
            testID="@home/portfolio/fiat-balance-header"
        />
    </DiscreetTextTrigger>
);

const SelectedPointFiatBalance = ({
    selectedPointFiatValueAtom,
}: Pick<GraphFiatBalanceProps, 'selectedPointFiatValueAtom'>) => {
    const selectedPointFiatValue = useAtomValue(selectedPointFiatValueAtom);
    const selectedPointFiatBalance = asBaseCurrencyAmount(new BigNumber(selectedPointFiatValue));

    return <FormattedBalance value={selectedPointFiatBalance} />;
};

const Balance = ({
    selectedPointFiatValueAtom,
    isGestureActiveAtom,
    totalBaseCurrencyBalance,
}: Pick<
    GraphFiatBalanceProps,
    'selectedPointFiatValueAtom' | 'isGestureActiveAtom' | 'totalBaseCurrencyBalance'
>) => {
    const isGestureActive = useAtomValue(isGestureActiveAtom);

    // While the user is not swiping the graph, the live total balance is displayed, because
    // the last graph point is frozen at fetch time and its value goes stale as rates move.
    if (!isGestureActive && totalBaseCurrencyBalance !== undefined) {
        return <FormattedBalance value={totalBaseCurrencyBalance} />;
    }

    return <SelectedPointFiatBalance selectedPointFiatValueAtom={selectedPointFiatValueAtom} />;
};

export const GraphBaseCurrencyBalance = ({
    selectedPointFiatValueAtom,
    selectedPointTimestampAtom,
    referencePointAtom,
    percentageChangeAtom,
    isGestureActiveAtom,
    showChange = true,
    isLoading = false,
    totalBaseCurrencyBalance,
    isHistoryEnabledAccount = true,
}: GraphFiatBalanceProps) => {
    const { applyStyle } = useNativeStyles();
    const firstGraphPoint = useAtomValue(referencePointAtom);
    const { DateTimeFormatter } = useFormatters();

    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
    const hasBalance = Number(totalBaseCurrencyBalance) !== 0;
    const showLoading = isLoading || !firstGraphPoint;
    const showBalanceFallback =
        !hasDeviceDiscovery && ((hasBalance && showLoading) || !isHistoryEnabledAccount);

    // If discovery finished but the graph still loading or missing first point, we just show the latest total balance
    if (showBalanceFallback) {
        return (
            <Box style={applyStyle(wrapperStyle)}>
                <Balance
                    selectedPointFiatValueAtom={selectedPointFiatValueAtom}
                    isGestureActiveAtom={isGestureActiveAtom}
                    totalBaseCurrencyBalance={totalBaseCurrencyBalance}
                />
                {showChange && (
                    <HStack alignItems="center">
                        {/*  Empty space to prevent layout shift */}
                        <Text variant="body-sm" color="contentSecondary">
                            <DateTimeFormatter value={new Date()} />
                        </Text>
                    </HStack>
                )}
            </Box>
        );
    }

    if (showLoading) {
        return <Skeleton />;
    }

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <Balance
                selectedPointFiatValueAtom={selectedPointFiatValueAtom}
                isGestureActiveAtom={isGestureActiveAtom}
                totalBaseCurrencyBalance={totalBaseCurrencyBalance}
            />
            {showChange && (
                <HStack alignItems="center">
                    <GraphDateFormatter
                        firstPointDate={firstGraphPoint.date}
                        selectedPointTimestampAtom={selectedPointTimestampAtom}
                    />
                    <PriceChangeIndicator percentageChangeAtom={percentageChangeAtom} />
                </HStack>
            )}
        </Box>
    );
};
