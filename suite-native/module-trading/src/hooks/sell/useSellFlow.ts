import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';

import { SellFormType } from '../../types/sell';
import { useConsent } from '../general/useConsent';
import { useConsentDenier } from '../general/useConsentDenier';

type SellFlowReturn = {
    canProceed: boolean;
    selectQuote: () => Promise<void>;
    isConsentRequested: boolean;
    giveConsent: () => void;
    cancelConsent: () => void;
};

export const useSellFlow = ({ watch }: SellFormType): SellFlowReturn => {
    const candidateQuote = watch('quote');
    const isLoading = useSelector(selectTradingSellIsLoading);
    const { isConsentRequested, waitForConsent, resolveConsent } = useConsent();
    useConsentDenier(candidateQuote?.exchange, resolveConsent);

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
