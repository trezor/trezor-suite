import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { GraphFiatBalance, selectHasDeviceHistoryEnabledAccounts } from '@suite-native/graph';
import { selectHasDeviceDiscovery, selectIsDeviceAuthorized } from '@suite-common/wallet-core';

import {
    hasPriceIncreasedAtom,
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../portfolioGraphAtoms';

export const PortfolioHeader = () => {
    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const isLoading = hasDiscovery || !isDeviceAuthorized;

    return (
        <Box testID="@home/portfolio/header">
            <VStack spacing="sp4" alignItems="center">
                {!isLoading && (
                    <GraphFiatBalance
                        selectedPointAtom={selectedPointAtom}
                        referencePointAtom={referencePointAtom}
                        percentageChangeAtom={percentageChangeAtom}
                        hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                        showChange={hasDeviceHistoryEnabledAccounts}
                    />
                )}
            </VStack>
        </Box>
    );
};
