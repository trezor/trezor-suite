import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { GraphFiatBalance } from '@suite-native/graph';
import { selectHasDeviceDiscovery, selectIsDeviceAuthorized } from '@suite-common/wallet-core';

import {
    hasPriceIncreasedAtom,
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../portfolioGraphAtoms';

export const PortfolioGraphHeader = () => {
    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isLoading = hasDiscovery || !isDeviceAuthorized;

    return (
        <Box>
            <VStack spacing="sp4" alignItems="center">
                {!isLoading && (
                    <GraphFiatBalance
                        selectedPointAtom={selectedPointAtom}
                        referencePointAtom={referencePointAtom}
                        percentageChangeAtom={percentageChangeAtom}
                        hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                    />
                )}
            </VStack>
        </Box>
    );
};
