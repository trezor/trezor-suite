import { useEffect } from 'react';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';

const useSavingsTrade = () => {
    const { invityAuthentication, savingsTrade, savingsInfo } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
        savingsInfo: state.wallet.coinmarket.savings.savingsInfo,
    }));

    const { loadInvityData, loadSavingsTrade } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
        loadSavingsTrade: coinmarketSavingsActions.loadSavingsTrade,
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const provider = savingsInfo?.savingsList?.providers[0];
    useEffect(() => {
        if (provider && invityAuthentication?.verified) {
            loadSavingsTrade(provider.name);
        }
    }, [loadSavingsTrade, provider, invityAuthentication]);

    return savingsTrade;
};

export default useSavingsTrade;
