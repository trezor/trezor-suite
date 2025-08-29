import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';

import { SellFormType } from '../../types/sell';
import { useConsent } from '../general/useConsent';

type SellFlowReturn = {
    canProceed: boolean;
    selectQuote: () => Promise<void>;
    isConsentRequested: boolean;
    giveConsent: () => void;
    cancelConsent: () => void;
};

export const useSellFlow = ({ watch }: SellFormType): SellFlowReturn => {
    const isLoading = useSelector(selectTradingSellIsLoading);
    const { isConsentRequested, waitForConsent, resolveConsent } = useConsent();

    const candidateQuote = watch('quote');

    const canProceed = !!candidateQuote && !isLoading;

    const selectQuote = useCallback(async () => {
        if (!candidateQuote) {
            return;
        }

        await waitForConsent();
    }, [waitForConsent, candidateQuote]);

    const giveConsent = useCallback(() => {
        resolveConsent(true);
    }, [resolveConsent]);

    const cancelConsent = useCallback(() => {
        resolveConsent(false);
    }, [resolveConsent]);

    return {
        canProceed,
        selectQuote,
        isConsentRequested,
        giveConsent,
        cancelConsent,
    };
};
