import { useSelector } from 'react-redux';

import { Atom, useAtomValue } from 'jotai';

import { FiatGraphPoint } from '@suite-common/graph';
import { Box, BoxSkeleton, DiscreetTextTrigger, HStack, VStack, Text } from '@suite-native/atoms';
import { FiatBalanceFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormatters } from '@suite-common/formatters';
import { selectHasDeviceDiscovery } from '@suite-common/wallet-core';

import { GraphDateFormatter } from './GraphDateFormatter';
import { PriceChangeIndicator } from './PriceChangeIndicator';

type BalanceProps = {
    selectedPointAtom: Atom<FiatGraphPoint | null>;
    latestValue?: string;
};

type GraphFiatBalanceProps = BalanceProps & {
    referencePointAtom: Atom<FiatGraphPoint | null>;
    percentageChangeAtom: Atom<number>;
    hasPriceIncreasedAtom: Atom<boolean>;
    showChange?: boolean;
    isLoading?: boolean;
    totalFiatBalance: string;
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

const Balance = ({ selectedPointAtom, latestValue }: BalanceProps) => {
    const point = useAtomValue(selectedPointAtom);
    const fiatValue =
        latestValue || point?.valueLatestTotal || (point?.value ? String(point.value) : '0');

    return (
        <DiscreetTextTrigger>
            <FiatBalanceFormatter value={fiatValue} />
        </DiscreetTextTrigger>
    );
};

export const GraphFiatBalance = ({
    selectedPointAtom,
    referencePointAtom,
    percentageChangeAtom,
    hasPriceIncreasedAtom,
    showChange = true,
    isLoading = false,
    totalFiatBalance,
    isHistoryEnabledAccount = true,
}: GraphFiatBalanceProps) => {
    const { applyStyle } = useNativeStyles();
    const firstGraphPoint = useAtomValue(referencePointAtom);
    const { DateTimeFormatter } = useFormatters();

    const hasDeviceDiscovery = useSelector(selectHasDeviceDiscovery);
    const hasBalance = Number(totalFiatBalance) !== 0;
    const showLoading = isLoading || !firstGraphPoint;
    const showBalanceFallback =
        !hasDeviceDiscovery && ((hasBalance && showLoading) || !isHistoryEnabledAccount);

    // If discovery finished but graph still loading or missing first point we just show latest total balance
    if (showBalanceFallback) {
        return (
            <Box style={applyStyle(wrapperStyle)}>
                <Balance selectedPointAtom={selectedPointAtom} latestValue={totalFiatBalance} />
                {showChange && (
                    <HStack alignItems="center">
                        {/*  Empty space to prevent layout shift */}
                        <Text variant="hint" color="textSubdued">
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
            <Balance selectedPointAtom={selectedPointAtom} />
            {showChange && (
                <HStack alignItems="center">
                    <GraphDateFormatter
                        firstPointDate={firstGraphPoint.date}
                        selectedPointAtom={selectedPointAtom}
                    />
                    <PriceChangeIndicator
                        hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                        percentageChangeAtom={percentageChangeAtom}
                    />
                </HStack>
            )}
        </Box>
    );
};
