import { useCallback, useEffect } from 'react';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';

const useSavingsTrade = () => {
    const { invityAuthentication, savingsTrade, savingsTradePayments, selectedProvider } =
        useSelector(state => ({
            invityAuthentication: state.wallet.coinmarket.invityAuthentication,
            savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
            savingsTradePayments: state.wallet.coinmarket.savings.savingsTradePayments,
            selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
        }));

    const { loadInvityData, loadSavingsTrade, saveSavingsTradeResponse } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
        loadSavingsTrade: coinmarketSavingsActions.loadSavingsTrade,
        saveSavingsTradeResponse: coinmarketSavingsActions.saveSavingsTradeResponse,
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    useEffect(() => {
        if (selectedProvider && invityAuthentication?.verified && !savingsTrade) {
            loadSavingsTrade(selectedProvider.name);
        }
    }, [loadSavingsTrade, selectedProvider, invityAuthentication, savingsTrade]);

    const loadSavingsTradeForce = useCallback(() => {
        if (selectedProvider && invityAuthentication?.verified) {
            loadSavingsTrade(selectedProvider.name);
        }
    }, [invityAuthentication?.verified, loadSavingsTrade, selectedProvider]);

    return { savingsTrade, savingsTradePayments, saveSavingsTradeResponse, loadSavingsTradeForce };
};

export default useSavingsTrade;
