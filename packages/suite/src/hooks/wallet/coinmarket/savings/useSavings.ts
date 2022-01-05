import { createContext, useEffect } from 'react';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';
import { SavingsContextValues } from '@wallet-types/coinmarket/savings';
import invityAPI from '@suite/services/suite/invityAPI';

export const SavingsContext = createContext<SavingsContextValues | null>(null);
SavingsContext.displayName = 'SavingsContext';

export const useSavings = (): SavingsContextValues => {
    const { loadInvityData, saveSavingsTradeResponse } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
        saveSavingsTradeResponse: coinmarketSavingsActions.saveSavingsTradeResponse,
    });
    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const { savingsInfo, savingsTrade } = useSelector(state => ({
        savingsInfo: state.wallet.coinmarket.savings.savingsInfo,
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
    }));

    const isLoading = !savingsInfo;
    // We have single savings provider for now.
    const providerInfo = savingsInfo?.savingsList?.providers[0];

    useEffect(() => {
        if (providerInfo) {
            const loadSavingsTrade = async () => {
                const savingsTrade = await invityAPI.getSavingsTrade(providerInfo.name);
                if (savingsTrade) {
                    saveSavingsTradeResponse(savingsTrade);
                }
            };
            loadSavingsTrade();
        }
    }, [providerInfo, saveSavingsTradeResponse]);

    return {
        isLoading,
        savingsInfo,
        savingsTrade,
        // TODO: Will be indicated by Invity API later.
        isRegisteredAccount: false,
        isClientFromUnsupportedCountry: !!providerInfo?.isClientFromUnsupportedCountry,
    };
};
