import { useCallback, useState } from 'react';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import * as notificationActions from '@suite-actions/notificationActions';
import { copyToClipboard } from '@suite-utils/dom';

import type {
    SavingsPaymentInfoContextValues,
    UseSavingsPaymentInfoProps,
} from '@wallet-types/coinmarket/savings/paymentInfo';
import useSavingsTrade from './useSavingsTrade';
import { useActions, useSelector } from '@suite-hooks';
import invityAPI, { SavingsPaymentInfo } from '@suite/services/suite/invityAPI';

export const useSavingsPaymentInfo = ({
    selectedAccount,
}: UseSavingsPaymentInfoProps): SavingsPaymentInfoContextValues => {
    const { navigateToSavingsSetup, navigateToSavingsOverview } = useCoinmarketNavigation(
        selectedAccount.account,
    );

    const isWatchingKYCStatus = useSelector(
        state => state.wallet.coinmarket.savings.isWatchingKYCStatus,
    );

    const handleEditButtonClick = useCallback(() => {
        navigateToSavingsSetup();
    }, [navigateToSavingsSetup]);

    const { savingsTrade, saveSavingsTradeResponse } = useSavingsTrade();

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

    const { addNotification } = useActions({ addNotification: notificationActions.addToast });
    const copy = (paymentInfoKey: keyof SavingsPaymentInfo) => {
        if (savingsTrade?.paymentInfo) {
            const result = copyToClipboard(savingsTrade.paymentInfo[paymentInfoKey], null);
            if (typeof result !== 'string') {
                addNotification({ type: 'copy-to-clipboard' });
            }
        }
    };

    return {
        fiatAmount: savingsTrade?.fiatStringAmount,
        fiatCurrency: savingsTrade?.fiatCurrency,
        paymentFrequency: savingsTrade?.paymentFrequency,
        paymentInfo: savingsTrade?.paymentInfo,
        handleEditButtonClick,
        handleSubmit,
        copy,
        isSubmitting,
        isWatchingKYCStatus,
    };
};
