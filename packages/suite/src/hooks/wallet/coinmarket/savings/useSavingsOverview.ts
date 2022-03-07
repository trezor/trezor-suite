import { createContext, useCallback, useContext } from 'react';
import {
    SavingsOverviewContextValues,
    UseSavingsOverviewProps,
} from '@wallet-types/coinmarket/savings/overview';
import useSavingsTrade from './useSavingsTrade';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import { useSelector } from '@suite-hooks';

export const SavingsOverviewContext = createContext<SavingsOverviewContextValues | null>(null);
SavingsOverviewContext.displayName = 'SavingsOverviewContext';

export const useSavingsOverview = ({
    selectedAccount,
}: UseSavingsOverviewProps): SavingsOverviewContextValues => {
    const { navigateToSavingsSetup } = useCoinmarketNavigation(selectedAccount.account);

    const isWatchingKYCStatus = useSelector(
        state => state.wallet.coinmarket.savings.isWatchingKYCStatus,
    );

    const { savingsTrade, savingsTradePayments } = useSavingsTrade();

    const handleEditSetupButtonClick = useCallback(() => {
        navigateToSavingsSetup();
    }, [navigateToSavingsSetup]);

    return {
        savingsTrade,
        savingsTradePayments,
        handleEditSetupButtonClick,
        isWatchingKYCStatus,
    };
};

export const useSavingsOverviewContext = () => {
    const context = useContext(SavingsOverviewContext);
    if (context === null) throw Error('SavingsOverviewContext used without Context');
    return context;
};
