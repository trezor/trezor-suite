import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { GraphFiatBalance } from '@suite-native/graph';
import { selectIsDeviceDiscoveryActive, selectIsDeviceAuthorized } from '@suite-common/wallet-core';

import {
    hasPriceIncreasedAtom,
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../portfolioGraphAtoms';

export const PortfolioGraphHeader = () => {
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isLoading = isDiscoveryActive || !isDeviceAuthorized;

    return (
        <Box>
            <VStack spacing="extraSmall" alignItems="center">
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
