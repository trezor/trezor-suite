import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { Box, VStack } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import {
    GraphBaseCurrencyBalance,
    portfolioGraphAtoms,
    selectHasDeviceHistoryEnabledAccounts,
} from '@suite-native/graph';

export const PortfolioHeader = () => {
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);
    const isLoading = useAtomValue(portfolioGraphAtoms.isLoadingAtom);

    return (
        <Box testID="@home/portfolio/header">
            <VStack spacing="sp4" alignItems="center">
                <GraphBaseCurrencyBalance
                    selectedPointFiatValueAtom={portfolioGraphAtoms.selectedPointFiatValueAtom}
                    selectedPointTimestampAtom={portfolioGraphAtoms.selectedPointTimestampAtom}
                    referencePointAtom={portfolioGraphAtoms.referencePointAtom}
                    percentageChangeAtom={portfolioGraphAtoms.percentageChangeAtom}
                    showChange={hasDeviceHistoryEnabledAccounts}
                    isLoading={isLoading}
                    totalBaseCurrencyBalance={totalFiatBalance}
                />
            </VStack>
        </Box>
    );
};

PortfolioHeader.displayName = 'PortfolioHeader';
