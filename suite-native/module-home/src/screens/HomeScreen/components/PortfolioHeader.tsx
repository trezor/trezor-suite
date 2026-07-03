import { useSelector } from 'react-redux';

import { Box, VStack } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import {
    GraphBaseCurrencyBalance,
    selectHasDeviceHistoryEnabledAccounts,
} from '@suite-native/graph';

import {
    percentageChangeAtom,
    referencePointAtom,
    selectedPointFiatValueAtom,
    selectedPointTimestampAtom,
} from '../portfolioGraphAtoms';

type PortfolioHeaderProps = {
    isLoading: boolean;
};

export const PortfolioHeader = ({ isLoading }: PortfolioHeaderProps) => {
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);

    return (
        <Box testID="@home/portfolio/header">
            <VStack spacing="sp4" alignItems="center">
                <GraphBaseCurrencyBalance
                    selectedPointFiatValueAtom={selectedPointFiatValueAtom}
                    selectedPointTimestampAtom={selectedPointTimestampAtom}
                    referencePointAtom={referencePointAtom}
                    percentageChangeAtom={percentageChangeAtom}
                    showChange={hasDeviceHistoryEnabledAccounts}
                    isLoading={isLoading}
                    totalBaseCurrencyBalance={totalFiatBalance}
                />
            </VStack>
        </Box>
    );
};

PortfolioHeader.displayName = 'PortfolioHeader';
