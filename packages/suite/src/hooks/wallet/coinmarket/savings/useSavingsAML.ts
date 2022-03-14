import { useCallback, useEffect, useState } from 'react';
import { useActions, useSelector } from '@suite-hooks';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import type {
    QuestionAnswer,
    SavingsAMLContextValues,
    UseSavingsAMLProps,
} from '@wallet-types/coinmarket/savings/AML';
import invityAPI, { SavingsTradeAMLAnswer } from '@suite-services/invityAPI';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import useSavingsTrade from './useSavingsTrade';

export const useSavingsAML = ({ selectedAccount }: UseSavingsAMLProps): SavingsAMLContextValues => {
    const { navigateToSavingsSetup } = useCoinmarketNavigation(selectedAccount.account);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { loadInvityData } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });
    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const { selectedProvider, isWatchingKYCStatus } = useSelector(state => ({
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
        isWatchingKYCStatus: state.wallet.coinmarket.savings.isWatchingKYCStatus,
    }));

    const { savingsTrade, saveSavingsTradeResponse } = useSavingsTrade();

    useEffect(() => {
        if (selectedProvider && !savingsTrade) {
            invityAPI
                .getSavingsTrade(selectedProvider.name)
                .then(response => response && saveSavingsTradeResponse(response));
        }
    }, [selectedProvider, saveSavingsTradeResponse, savingsTrade]);

    const handleSubmit = useCallback(
        async (amlAnswers: SavingsTradeAMLAnswer[]) => {
            setIsSubmitting(true);
            if (savingsTrade) {
                const savingsTradeRequest = {
                    trade: {
                        ...savingsTrade,
                        amlAnswers,
                    },
                };
                const response = await invityAPI.doSavingsTrade(savingsTradeRequest);
                if (!response?.errorMessage) {
                    navigateToSavingsSetup();
                } else {
                    // TODO: show error
                }
            }
            setIsSubmitting(false);
        },
        [navigateToSavingsSetup, savingsTrade],
    );

    const [selectedQuestionAnswers, setSelectedQuestionAnswers] = useState<QuestionAnswer>({});
    const handleAmlAnswerOptionClick = useCallback(
        (questionKey: string, answer: string) => {
            setSelectedQuestionAnswers({
                ...selectedQuestionAnswers,
                [questionKey]: answer,
            });
        },
        [selectedQuestionAnswers],
    );
    const selectedQuestionAnswerEntries = Object.entries(selectedQuestionAnswers);
    const canSubmitAnswers =
        selectedQuestionAnswerEntries.length === savingsTrade?.amlQuestions?.length &&
        !isSubmitting;
    const answers = selectedQuestionAnswerEntries.map<SavingsTradeAMLAnswer>(([key, answer]) => ({
        key,
        answer,
    }));

    return {
        amlQuestions: savingsTrade?.amlQuestions,
        handleSubmit,
        isSubmitting,
        handleAmlAnswerOptionClick,
        canSubmitAnswers,
        answers,
        selectedQuestionAnswers,
        isWatchingKYCStatus,
    };
};
