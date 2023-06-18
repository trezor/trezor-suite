import { createContext, useCallback, useContext } from 'react';
import type {
    SavingsOverviewContextValues,
    UseSavingsOverviewProps,
} from 'src/types/wallet/coinmarketSavingsOverview';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useSelector } from 'src/hooks/suite';
import { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import BigNumber from 'bignumber.js';

export const SavingsOverviewContext = createContext<SavingsOverviewContextValues | null>(null);
SavingsOverviewContext.displayName = 'SavingsOverviewContext';

export const useSavingsOverview = ({
    selectedAccount,
}: UseSavingsOverviewProps): SavingsOverviewContextValues => {
    const { account } = selectedAccount;
    const { navigateToSavingsSetupContinue } = useCoinmarketNavigation(account);

    const {
        isWatchingKYCStatus,
        kycFinalStatus,
        savingsTrade,
        selectedProvider,
        savingsTradePayments,
        isSavingsTradeLoading,
        trades,
        fiat,
    } = useSelector(state => ({
        isWatchingKYCStatus: state.wallet.coinmarket.savings.isWatchingKYCStatus,
        kycFinalStatus: state.wallet.coinmarket.savings.kycFinalStatus,
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
        savingsTradePayments: state.wallet.coinmarket.savings.savingsTradePayments,
        isSavingsTradeLoading: state.wallet.coinmarket.savings.isSavingsTradeLoading,
        trades: state.wallet.coinmarket.trades,
        fiat: state.wallet.fiat,
    }));

    const savingsCryptoSum = trades.reduce((previous: BigNumber, current: Trade) => {
        if (
            current.account.descriptor === account.descriptor &&
            current.tradeType === 'savings' &&
            current.data.receiveStringAmount &&
            current.data.status === 'Completed'
        ) {
            previous = previous.plus(new BigNumber(current.data.receiveStringAmount));
        }
        return previous;
    }, new BigNumber(0));

    const savingsTradeItemCompletedExists = savingsCryptoSum.isGreaterThan(0);

    let savingsFiatSum = new BigNumber(0);
    const fiatRates = fiat.coins.find(item => item.symbol === account.symbol);
    if (fiatRates?.current?.rates && savingsTrade?.fiatCurrency) {
        const rate = fiatRates.current.rates[savingsTrade.fiatCurrency.toLowerCase()];
        if (rate) {
            savingsFiatSum = new BigNumber(savingsCryptoSum).multipliedBy(rate).decimalPlaces(2);
        }
    }

    const handleEditSetupButtonClick = useCallback(() => {
        navigateToSavingsSetupContinue();
    }, [navigateToSavingsSetupContinue]);

    return {
        savingsTrade,
        savingsTradePayments,
        handleEditSetupButtonClick,
        isWatchingKYCStatus,
        isSavingsTradeLoading,
        savingsTradeItemCompletedExists,
        savingsCryptoSum: savingsCryptoSum.toFixed(),
        savingsFiatSum: savingsFiatSum.toFixed(),
        kycFinalStatus,
        selectedProvider,
        account,
    };
};

export const useSavingsOverviewContext = () => {
    const context = useContext(SavingsOverviewContext);
    if (context === null) throw Error('SavingsOverviewContext used without Context');
    return context;
};
