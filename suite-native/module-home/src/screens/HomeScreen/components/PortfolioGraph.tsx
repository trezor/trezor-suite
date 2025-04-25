import { forwardRef, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { selectHasDeviceDiscovery } from '@suite-common/wallet-core';
import { Box, Text, VStack } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';
import {
    Graph,
    TimeSwitch,
    selectHasDeviceHistoryEnabledAccounts,
    selectHasDeviceHistoryIgnoredAccounts,
    useGraphAtoms,
    useGraphForAllDeviceAccounts,
} from '@suite-native/graph';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { referencePointAtom, selectedPointAtom } from '../portfolioGraphAtoms';
import { PortfolioHeader } from './PortfolioHeader';

export type PortfolioGraphRef = {
    refetchGraph: () => Promise<void>;
};

const ignoredNetworksContentStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    marginHorizontal: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    gap: utils.spacings.sp12,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
    borderColor: utils.colors.backgroundTertiaryDefaultOnElevationNegative,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.r16,
    alignItems: 'center',
}));

const IgnoredNetworksBanner = () => {
    const { applyStyle } = useNativeStyles();
    const hasDeviceHistoryIgnoredAccounts = useSelector(selectHasDeviceHistoryIgnoredAccounts);

    if (!hasDeviceHistoryIgnoredAccounts) {
        return null;
    }

    return (
        <Box style={applyStyle(ignoredNetworksContentStyle)}>
            <CryptoIcon symbol="sol" size="small" />
            <Text variant="hint">
                <Translation id="moduleHome.graphIgnoredNetworks.sol" />
            </Text>
        </Box>
    );
};

export const PortfolioGraph = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const hasDeviceDiscovery = useSelector(selectHasDeviceDiscovery);
    const loadingTakesLongerThanExpected = useIsDiscoveryDurationTooLong();
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);

    const {
        graphPoints,
        error,
        isLoading,
        isAnyMainnetAccountPresent,
        refetch,
        onSelectTimeFrame,
        timeframe,
    } = useGraphForAllDeviceAccounts({
        fiatCurrency: fiatCurrencyCode,
    });

    const { handleGestureStart, setInitialSelectedPoints, setSelectedPoint } = useGraphAtoms({
        referencePointAtom,
        selectedPointAtom,
        graphPoints,
        totalFiatBalance,
    });

    useImperativeHandle(
        ref,
        () => ({
            refetchGraph: refetch,
        }),
        [refetch],
    );

    const showHeader = isAnyMainnetAccountPresent || isLoading;
    const showGraph = hasDeviceHistoryEnabledAccounts || hasDeviceDiscovery;

    return (
        <VStack spacing="sp24" testID="@home/portfolio/graph">
            {showHeader && (
                <PortfolioHeader isLoading={isLoading} totalFiatBalance={totalFiatBalance} />
            )}
            {showGraph && (
                <Graph
                    points={graphPoints}
                    loading={isLoading}
                    loadingTakesLongerThanExpected={loadingTakesLongerThanExpected}
                    onPointSelected={setSelectedPoint}
                    onGestureEnd={setInitialSelectedPoints}
                    onGestureStart={handleGestureStart}
                    onTryAgain={refetch}
                    error={error?.message}
                />
            )}
            <IgnoredNetworksBanner />
            {showGraph && (
                <TimeSwitch selectedTimeFrame={timeframe} onSelectTimeFrame={onSelectTimeFrame} />
            )}
        </VStack>
    );
});
