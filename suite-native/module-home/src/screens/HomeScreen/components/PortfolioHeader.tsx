import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import {
    GraphBaseCurrencyBalance,
    portfolioGraphAtoms,
    selectHasDeviceHistoryEnabledAccounts,
    selectHasPortfolioGraphAccounts,
    selectPortfolioGraphIsLoading,
    selectPortfolioGraphPoints,
} from '@suite-native/graph';

type PortfolioHeaderContentProps = {
    isLoading: boolean;
};

const PortfolioHeaderContent = ({ isLoading }: PortfolioHeaderContentProps) => {
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);
    const graphPoints = useSelector(selectPortfolioGraphPoints);

    return (
        <Box testID="@home/portfolio/header">
            <VStack spacing="sp4" alignItems="center">
                <GraphBaseCurrencyBalance
                    points={graphPoints}
                    selectedPointAtom={portfolioGraphAtoms.selectedPointAtom}
                    isGestureActiveAtom={portfolioGraphAtoms.isGestureActiveAtom}
                    showChange={hasDeviceHistoryEnabledAccounts}
                    isLoading={isLoading}
                    totalBaseCurrencyBalance={totalFiatBalance}
                />
            </VStack>
        </Box>
    );
};

export const PortfolioHeader = () => {
    const hasPortfolioGraphAccounts = useSelector(selectHasPortfolioGraphAccounts);
    const isLoading = useSelector(selectPortfolioGraphIsLoading);

    if (!hasPortfolioGraphAccounts && !isLoading) return null;

    return <PortfolioHeaderContent isLoading={isLoading} />;
};

PortfolioHeader.displayName = 'PortfolioHeader';
