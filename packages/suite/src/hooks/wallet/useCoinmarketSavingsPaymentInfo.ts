import { useCallback, useState } from 'react';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import type {
    SavingsPaymentInfoContextValues,
    UseSavingsPaymentInfoProps,
} from '@wallet-types/coinmarketSavingsPaymentInfo';
import { useActions, useSelector } from '@suite-hooks';
import invityAPI from '@suite/services/suite/invityAPI';
import { useCoinmarketSavingsPaymentInfoCopy } from '@wallet-hooks/useCoinmarketSavingsPaymentInfoCopy';

export const useSavingsPaymentInfo = ({
    selectedAccount,
}: UseSavingsPaymentInfoProps): SavingsPaymentInfoContextValues => {
    const { navigateToSavingsSetupContinue, navigateToSavingsOverview } = useCoinmarketNavigation(
        selectedAccount.account,
    );

    const { isWatchingKYCStatus, kycFinalStatus } = useSelector(state => ({
        isWatchingKYCStatus: state.wallet.coinmarket.savings.isWatchingKYCStatus,
        kycFinalStatus: state.wallet.coinmarket.savings.kycFinalStatus,
    }));

    const handleEditButtonClick = useCallback(() => {
        navigateToSavingsSetupContinue();
    }, [navigateToSavingsSetupContinue]);

    const { savingsTrade, selectedProvider, isSavingsTradeLoading } = useSelector(state => ({
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
        isSavingsTradeLoading: state.wallet.coinmarket.savings.isSavingsTradeLoading,
    }));

    const { saveSavingsTradeResponse } = useActions({
        saveSavingsTradeResponse: coinmarketSavingsActions.saveSavingsTradeResponse,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        if (savingsTrade) {
            const response = await invityAPI.doSavingsTrade({ trade: savingsTrade });
            if (response) {
                saveSavingsTradeResponse(response);
                navigateToSavingsOverview();
            }
        }
        setIsSubmitting(false);
    }, [navigateToSavingsOverview, saveSavingsTradeResponse, savingsTrade]);

    const { copyPaymentInfo } = useCoinmarketSavingsPaymentInfoCopy(savingsTrade?.paymentInfo);

    return {
        savingsTrade,
        handleEditButtonClick,
        handleSubmit,
        copyPaymentInfo,
        isSubmitting,
        isWatchingKYCStatus,
        isSavingsTradeLoading,
        kycFinalStatus,
        selectedProviderName: selectedProvider?.companyName,
    };
};
