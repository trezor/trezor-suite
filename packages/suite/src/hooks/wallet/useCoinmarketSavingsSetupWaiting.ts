import { useCallback, useEffect } from 'react';
import type {
    UseCoinmarketSavingsSetupWaitingProps,
    UseCoinmarketSavingsSetupWaitingValues,
} from '@wallet-types/coinmarketSavingsSetupWaiting';
import { useActions, useSelector } from '@suite-hooks';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import { useFormDraft } from '@wallet-hooks/useFormDraft';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as pollingActions from '@wallet-actions/pollingActions';
import { isDesktop } from '@suite-utils/env';

export const useCoinmarketSavingsSetupWaiting = ({
    selectedAccount,
}: UseCoinmarketSavingsSetupWaitingProps): UseCoinmarketSavingsSetupWaitingValues => {
    const { account } = selectedAccount;
    const { savingsTrade, kycFinalStatus } = useSelector(state => ({
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
        kycFinalStatus: state.wallet.coinmarket.savings.kycFinalStatus,
    }));
    const { submitRequestForm, stopPolling } = useActions({
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        stopPolling: pollingActions.stopPolling,
    });

    const { navigateToSavingsSetup, navigateToSavingsSetupContinue } =
        useCoinmarketNavigation(account);

    const { getDraft } = useFormDraft('coinmarket-savings-setup-request');

    useEffect(() => {
        if (savingsTrade?.status === 'SetSavingsParameters') {
            navigateToSavingsSetup();
        }
    }, [navigateToSavingsSetup, savingsTrade?.status]);

    useEffect(() => {
        if (kycFinalStatus && ['Failed', 'Error'].includes(kycFinalStatus)) {
            if (isDesktop()) {
                stopPolling(`coinmarket-savings-trade/${account.descriptor}`);
            }
            navigateToSavingsSetupContinue();
        }
    }, [account.descriptor, kycFinalStatus, navigateToSavingsSetupContinue, stopPolling]);

    // TODO:
    /** Edge case scenario for Suite Web
     * - user started savings flow
     * - user uploaded KYC documents on Invity web
     * - user opened new tab in browser with Suite
     * - user sees "waiting" page in Suite
     * - user finishes flow on Invity web
     * - user still sees "waiting" page
     * -> user should see "setup continue" page instead of "waiting" page
     */

    const handleGoToInvity = useCallback(() => {
        const form = getDraft(account.descriptor) as Parameters<typeof submitRequestForm>[0];
        if (form) {
            submitRequestForm(form);
        }
    }, [account.descriptor, getDraft, submitRequestForm]);

    return {
        handleGoToInvity,
    };
};
