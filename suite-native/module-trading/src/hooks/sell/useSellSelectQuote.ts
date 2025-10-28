import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectTradingSellInfo,
    selectTradingSellIsLoading,
    sellThunks,
    tradingSellActions,
} from '@suite-common/trading';
import {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';
import { SellFormType } from '@suite-native/trading-types';
import { useNullTimer } from '@trezor/react-utils';

import { useConsent } from '../general/useConsent';
import { useConsentDenier } from '../general/useConsentDenier';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.TradingSellPreview,
    RootStackParamList
>;

type SellSelectQuoteReturn = {
    canProceed: boolean;
    isLegalTermsConsentRequested: boolean;
    selectQuote: () => Promise<void>;
    giveLegalTermsConsent: () => void;
    cancelLegalTermsConsent: () => void;
};

export const useSellSelectQuote = ({ watch }: SellFormType): SellSelectQuoteReturn => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const timer = useNullTimer();
    const candidateQuote = watch('quote');
    const isLoading = useSelector(selectTradingSellIsLoading);
    const sellInfo = useSelector(selectTradingSellInfo);

    const sendAccount = useSelector(selectSellSelectedSendAccount);

    const {
        isConsentRequested: isLegalTermsConsentRequested,
        waitForConsent: waitForLegalTermsConsent,
        resolveConsent: resolveLegalTermsConsent,
    } = useConsent();
    useConsentDenier(candidateQuote?.exchange, resolveLegalTermsConsent);

    const canProceed = !!candidateQuote && !!sendAccount && !isLoading;

    const giveLegalTermsConsent = useCallback(() => {
        resolveLegalTermsConsent(true);
    }, [resolveLegalTermsConsent]);

    const cancelLegalTermsConsent = useCallback(() => {
        resolveLegalTermsConsent(false);
    }, [resolveLegalTermsConsent]);

    const selectQuote = useCallback(async () => {
        if (!candidateQuote || isLoading) {
            return;
        }

        const provider = candidateQuote.exchange
            ? sellInfo?.providerInfos[candidateQuote.exchange]
            : undefined;

        if (provider?.flow === 'BANK_ACCOUNT') {
            dispatch(tradingSellActions.setFormStep('BANK_ACCOUNT'));
        } else {
            dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
        }

        const nextStep = () => {
            // bank account and txn handling will be done in the next step
            navigation.navigate(TradingStackRoutes.TradingSellPreview);
        };

        await dispatch(
            sellThunks.selectQuoteThunk({
                quote: candidateQuote,
                timer,
                userConsent: waitForLegalTermsConsent,
                nextStep,
                onCancel: () => {},
            }),
        );
    }, [
        candidateQuote,
        isLoading,
        navigation,
        dispatch,
        timer,
        waitForLegalTermsConsent,
        sellInfo,
    ]);

    return {
        canProceed,
        isLegalTermsConsentRequested,
        giveLegalTermsConsent,
        cancelLegalTermsConsent,
        selectQuote,
    };
};
