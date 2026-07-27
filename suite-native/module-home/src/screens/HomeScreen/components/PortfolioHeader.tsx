import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import {
    GraphBaseCurrencyBalance,
    portfolioGraphAtoms,
    selectHasDeviceHistoryEnabledAccounts,
    selectHasPortfolioGraphAccounts,
    selectPortfolioGraphIsLoading,
} from '@suite-native/graph';

type PortfolioHeaderContentProps = {
    isLoading: boolean;
};

const PortfolioHeaderContent = ({ isLoading }: PortfolioHeaderContentProps) => {
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);

    return (
        <Box testID="@home/portfolio/header">
            <VStack spacing="sp4" alignItems="center">
                <GraphBaseCurrencyBalance
                    selectedPointFiatValueAtom={portfolioGraphAtoms.selectedPointFiatValueAtom}
                    selectedPointTimestampAtom={portfolioGraphAtoms.selectedPointTimestampAtom}
                    referencePointAtom={portfolioGraphAtoms.referencePointAtom}
                    percentageChangeAtom={portfolioGraphAtoms.percentageChangeAtom}
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
