import { useCallback, useEffect } from 'react';
import { useActions, useSelector } from '@suite-hooks';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { SavingsAMLContextValues, UseSavingsAMLProps } from '@wallet-types/coinmarket/savings/AML';
import invityAPI, { SavingsTradeAMLAnswer } from '@suite-services/invityAPI';

// TODO: We will need navigation (thus selected account) later.
// eslint-disable-next-line no-empty-pattern
export const useSavingsAML = ({}: UseSavingsAMLProps): SavingsAMLContextValues => {
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
        async (answers: SavingsTradeAMLAnswer[]) => {
            const savingsTradeRequest = {
                trade: {
                    ...savingsTrade,
                    answers,
                },
            };
            const response = await invityAPI.doSavingsTrade(savingsTradeRequest);
            if (!response?.trade.errors) {
                // TODO: navigate to setup
            }
        },
        [savingsTrade],
    );

    return {
        amlQuestions: savingsTrade?.amlQuestions,
        handleSubmit,
    };
};
