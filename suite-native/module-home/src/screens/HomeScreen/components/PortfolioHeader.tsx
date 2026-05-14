import { useSelector } from 'react-redux';

import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';
import {
    GraphBaseCurrencyBalance,
    selectHasDeviceHistoryEnabledAccounts,
} from '@suite-native/graph';

import {
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../portfolioGraphAtoms';

type PortfolioHeaderProps = {
    isLoading: boolean;
    totalFiatBalance?: BaseCurrencyAmount;
};

export const PortfolioHeader = ({ isLoading, totalFiatBalance }: PortfolioHeaderProps) => {
    const hasDeviceHistoryEnabledAccounts = useSelector(selectHasDeviceHistoryEnabledAccounts);

    return (
        <Box testID="@home/portfolio/header">
            <VStack spacing="sp4" alignItems="center">
                <GraphBaseCurrencyBalance
                    selectedPointAtom={selectedPointAtom}
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
