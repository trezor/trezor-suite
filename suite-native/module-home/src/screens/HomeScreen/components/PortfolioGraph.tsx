import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import {
    useGraphForAllDeviceAccounts,
    Graph,
    TimeSwitch,
    selectHasDeviceHistoryEnabledAccounts,
    selectHasDeviceHistoryIgnoredAccounts,
} from '@suite-native/graph';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { Box, VStack, Text } from '@suite-native/atoms';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectHasDeviceDiscovery } from '@suite-common/wallet-core';

import { PortfolioHeader } from './PortfolioHeader';
import { referencePointAtom, selectedPointAtom } from '../portfolioGraphAtoms';

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
            refetchGraph: refetch,
        }),
        [refetch],
    );

    const showGraph = hasDeviceHistoryEnabledAccounts || hasDeviceDiscovery;

    return (
        <VStack spacing="sp24" testID="@home/portfolio/graph">
            {isAnyMainnetAccountPresent ? <PortfolioHeader /> : null}

            {showGraph && (
                <Graph
                    points={graphPoints}
                    loading={isLoading}
                    loadingTakesLongerThanExpected={loadingTakesLongerThanExpected}
                    onPointSelected={setSelectedPoint}
                    onGestureEnd={setInitialSelectedPoints}
                    onTryAgain={refetch}
                    error={error}
                />
            )}
            <IgnoredNetworksBanner />
            {showGraph && (
                <TimeSwitch selectedTimeFrame={timeframe} onSelectTimeFrame={onSelectTimeFrame} />
            )}
        </VStack>
    );
});
