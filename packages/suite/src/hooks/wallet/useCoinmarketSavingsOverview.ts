import { createContext, useCallback, useContext } from 'react';
import type {
    SavingsOverviewContextValues,
    UseSavingsOverviewProps,
} from 'src/types/wallet/coinmarketSavingsOverview';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useSelector } from 'src/hooks/suite';
import { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import BigNumber from 'bignumber.js';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export const SavingsOverviewContext = createContext<SavingsOverviewContextValues | null>(null);
SavingsOverviewContext.displayName = 'SavingsOverviewContext';

export const useSavingsOverview = ({
    selectedAccount,
}: UseSavingsOverviewProps): SavingsOverviewContextValues => {
    const { account } = selectedAccount;

    const { navigateToSavingsSetupContinue } = useCoinmarketNavigation(account);

    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const {
        isSavingsTradeLoading,
        isWatchingKYCStatus,
        kycFinalStatus,
        savingsTrade,
        savingsTradePayments,
        selectedProvider,
    } = useSelector(state => state.wallet.coinmarket.savings);

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
    const fiatRateKey = getFiatRateKey(
        account.symbol,
        (savingsTrade?.fiatCurrency || '') as FiatCurrencyCode,
    );
    const fiatRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));
    if (fiatRate?.rate && savingsTrade?.fiatCurrency) {
        savingsFiatSum = new BigNumber(savingsCryptoSum)
            .multipliedBy(fiatRate?.rate)
            .decimalPlaces(2);
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
