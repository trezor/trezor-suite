import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { GraphFiatBalance, selectHasDeviceHistoryEnabledAccounts } from '@suite-native/graph';

import {
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../portfolioGraphAtoms';

type PortfolioHeaderProps = {
    isLoading: boolean;
    totalFiatBalance: string;
};

export const PortfolioHeader = ({ isLoading, totalFiatBalance }: PortfolioHeaderProps) => {
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);

    return (
        <Box testID="@home/portfolio/header">
            <VStack spacing="sp4" alignItems="center">
                <GraphFiatBalance
                    selectedPointAtom={selectedPointAtom}
                    referencePointAtom={referencePointAtom}
                    percentageChangeAtom={percentageChangeAtom}
                    showChange={hasDeviceHistoryEnabledAccounts}
                    isLoading={isLoading}
                    totalFiatBalance={totalFiatBalance}
                />
            </VStack>
        </Box>
    );
};
