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
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { useSellAnalyticReportCallback } from '@suite-native/trading-analytics';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';
import { type SellFormType } from '@suite-native/trading-types';

import { clearSellFormQuoteData } from './useSellForm';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.Trading,
    RootStackParamList
>;

type SellSelectQuoteReturn = {
    canProceed: boolean;
    selectQuote: () => Promise<void>;
};

export const useSellSelectQuote = (form: SellFormType): SellSelectQuoteReturn => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
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
            navigation.navigate(RootStackRoutes.TradingSellPreview);
            clearSellFormQuoteData(form);
        };

        await dispatch(
            sellThunks.selectQuoteThunk({
                quote: candidateQuote,
                nextStep,
            }),
        );
    }, [
        candidateQuote,
        isLoading,
        analyticsReportCallback,
        sellInfo?.providerInfos,
        dispatch,
        navigation,
        form,
    ]);

    return {
        canProceed,
        selectQuote,
    };
};
