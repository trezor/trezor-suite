import { useCallback, useEffect } from 'react';
import { useActions, useSelector } from '@suite-hooks';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import type {
    SavingsAMLContextValues,
    UseSavingsAMLProps,
} from '@wallet-types/coinmarket/savings/AML';
import invityAPI, { SavingsTradeAMLAnswer } from '@suite-services/invityAPI';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';

export const useSavingsAML = ({ selectedAccount }: UseSavingsAMLProps): SavingsAMLContextValues => {
    const { navigateToSavingsSetup } = useCoinmarketNavigation(selectedAccount.account);

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
        isLoading: state.wallet.coinmarket.isLoading,
    }));

    const provider = savingsInfo?.savingsList?.providers[0];
    useEffect(() => {
        if (provider && !savingsTrade) {
            invityAPI
                .getSavingsTrade(provider.name)
                .then(response => response && saveSavingsTradeResponse(response));
        }
    }, [provider, saveSavingsTradeResponse, savingsTrade]);

    const handleSubmit = useCallback(
        async (amlAnswers: SavingsTradeAMLAnswer[]) => {
            if (savingsTrade) {
                const savingsTradeRequest = {
                    trade: {
                        ...savingsTrade,
                        amlAnswers,
                    },
                };
                const response = await invityAPI.doSavingsTrade(savingsTradeRequest);
                if (!response?.trade.errors) {
                    navigateToSavingsSetup();
                }
            }
        },
        [navigateToSavingsSetup, savingsTrade],
    );

    return {
        amlQuestions: savingsTrade?.amlQuestions,
        handleSubmit,
    };
};
