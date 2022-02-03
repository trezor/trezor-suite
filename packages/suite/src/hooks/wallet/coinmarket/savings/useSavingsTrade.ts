import { useEffect } from 'react';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';

const useSavingsTrade = () => {
    const { invityAuthentication, savingsTrade, selectedProvider } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
    }));

    const { loadInvityData, loadSavingsTrade } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
        loadSavingsTrade: coinmarketSavingsActions.loadSavingsTrade,
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    useEffect(() => {
        if (selectedProvider && invityAuthentication?.verified) {
            loadSavingsTrade(selectedProvider.name);
        }
    }, [loadSavingsTrade, selectedProvider, invityAuthentication]);

    return savingsTrade;
};

export default useSavingsTrade;
