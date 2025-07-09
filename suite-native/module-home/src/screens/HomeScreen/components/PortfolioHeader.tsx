import { useSelector } from 'react-redux';

import { BaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Box, VStack } from '@suite-native/atoms';
import { GraphFiatBalance, selectHasDeviceHistoryEnabledAccounts } from '@suite-native/graph';

import {
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../portfolioGraphAtoms';

type PortfolioHeaderProps = {
    isLoading: boolean;
    totalFiatBalance: BaseCurrencyAmount;
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
