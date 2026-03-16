import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectTradingSellInfo,
    selectTradingSellIsLoading,
    sellThunks,
    tradingSellActions,
} from '@suite-common/trading';
import { useFormState } from '@suite-native/forms';
import {
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useSellAnalyticReportCallback } from '@suite-native/trading-analytics';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';
import { type SellFormType } from '@suite-native/trading-types';
import { useNullTimer } from '@trezor/react-utils';

import { clearSellFormQuoteData } from './useSellForm';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.TradingSellPreview,
    RootStackParamList
>;

type SellSelectQuoteReturn = {
    canProceed: boolean;
    selectQuote: () => Promise<void>;
};

export const useSellSelectQuote = (form: SellFormType): SellSelectQuoteReturn => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const timer = useNullTimer();
    const { watch, control } = form;
    const { isValid } = useFormState({ control });
    const candidateQuote = watch('quote');
    const isLoading = useSelector(selectTradingSellIsLoading);
    const sellInfo = useSelector(selectTradingSellInfo);

    const sendAccount = useSelector(selectSellSelectedSendAccount);

    const canProceed = isValid && !!candidateQuote && !!sendAccount && !isLoading;
    const analyticsReportCallback = useSellAnalyticReportCallback(candidateQuote);

    const selectQuote = useCallback(async () => {
        if (!candidateQuote || isLoading) {
            return;
        }

        analyticsReportCallback('sell-form', 'continue');

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
            clearSellFormQuoteData(form);
        };

        await dispatch(
            sellThunks.selectQuoteThunk({
                quote: candidateQuote,
                timer,
                nextStep,
            }),
        );
    }, [
        candidateQuote,
        isLoading,
        analyticsReportCallback,
        sellInfo?.providerInfos,
        dispatch,
        timer,
        navigation,
        form,
    ]);

    return {
        canProceed,
        selectQuote,
    };
};
