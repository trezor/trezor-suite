import { useCallback, useState } from 'react';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { saveSavingsTradeResponse } from 'src/actions/wallet/coinmarketSavingsActions';
import type {
    SavingsPaymentInfoContextValues,
    UseSavingsPaymentInfoProps,
} from 'src/types/wallet/coinmarketSavingsPaymentInfo';
import { useDispatch, useSelector } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import { useCoinmarketSavingsPaymentInfoCopy } from 'src/hooks/wallet/useCoinmarketSavingsPaymentInfoCopy';

export const useSavingsPaymentInfo = ({
    selectedAccount,
}: UseSavingsPaymentInfoProps): SavingsPaymentInfoContextValues => {
    const { navigateToSavingsSetupContinue, navigateToSavingsOverview } = useCoinmarketNavigation(
        selectedAccount.account,
    );

    const {
        savingsTrade,
        selectedProvider,
        isSavingsTradeLoading,
        isWatchingKYCStatus,
        kycFinalStatus,
    } = useSelector(state => state.wallet.coinmarket.savings);
    const dispatch = useDispatch();

    const handleEditButtonClick = useCallback(() => {
        navigateToSavingsSetupContinue();
    }, [navigateToSavingsSetupContinue]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        if (savingsTrade) {
            const response = await invityAPI.doSavingsTrade({ trade: savingsTrade });
            if (response) {
                dispatch(saveSavingsTradeResponse(response));
                navigateToSavingsOverview();
            }
        }
        setIsSubmitting(false);
    }, [dispatch, navigateToSavingsOverview, savingsTrade]);

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
