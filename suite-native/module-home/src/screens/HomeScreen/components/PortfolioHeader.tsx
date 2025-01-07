import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { GraphFiatBalance, selectHasDeviceHistoryEnabledAccounts } from '@suite-native/graph';

import {
    hasPriceIncreasedAtom,
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../portfolioGraphAtoms';

type PortfolioHeaderProps = {
    isLoading: boolean;
};

export const PortfolioHeader = ({ isLoading }: PortfolioHeaderProps) => {
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);

    return (
        <Box testID="@home/portfolio/header">
            <VStack spacing="sp4" alignItems="center">
                <GraphFiatBalance
                    selectedPointAtom={selectedPointAtom}
                    referencePointAtom={referencePointAtom}
                    percentageChangeAtom={percentageChangeAtom}
                    hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                    showChange={hasDeviceHistoryEnabledAccounts}
                    isLoading={isLoading}
                />
            </VStack>
        </Box>
    );
};
