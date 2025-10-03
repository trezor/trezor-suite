import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    exchangeThunks,
    selectTradingExchangeIsLoading,
    selectTradingMaxSlippagePercentage,
} from '@suite-common/trading';
import {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useTimer } from '@trezor/react-utils';

import { useExchangeAnalyticReportCallback } from './useExchangeAnalyticReportCallback';
import { clearExchangeFormQuoteData } from './useExchangeForm';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '../../selectors/exchangeSelectors';
import { ExchangeFormType } from '../../types/exchange';
import { isFullySelectedReceiveAccount } from '../../utils/general/receiveAccountUtils';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';
import { useConsent } from '../general/useConsent';
import { useConsentDenier } from '../general/useConsentDenier';

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export const useExchangeSelectQuote = (form: ExchangeFormType) => {
    const dispatch = useDispatch();
    const timer = useTimer();

    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const receiveAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const swapSlippage = useSelector(selectTradingMaxSlippagePercentage);

    const navigation = useNavigation<NavigationProps>();

    const [candidateQuote, receiveAsset] = form.watch(['quote', 'receiveAsset']);

    const { isConsentRequested, waitForConsent, resolveConsent } = useConsent();
    useConsentDenier(candidateQuote?.exchange, resolveConsent);
    const analyticsReportCallback = useExchangeAnalyticReportCallback(candidateQuote);

    const canProceed = !isLoading && !!candidateQuote && !!sendAccount;

    const selectReceiveAccount = () => {
        const selectedNetworkSymbol = getSymbolFromTradeableAsset(receiveAsset);
        if (selectedNetworkSymbol) {
            navigation.navigate(TradingStackRoutes.ReceiveAccounts, {
                symbol: selectedNetworkSymbol,
                tradingType: 'exchange',
            });
        }
    };

    const giveConsent = useCallback(() => {
        resolveConsent(true);
        analyticsReportCallback('exchange-terms-modal', 'continue');
    }, [resolveConsent, analyticsReportCallback]);

    const cancelConsent = useCallback(() => {
        resolveConsent(false);
        analyticsReportCallback('exchange-terms-modal', 'cancel');
    }, [resolveConsent, analyticsReportCallback]);

    const selectQuote = async () => {
        if (!candidateQuote || isLoading) {
            return;
        }

        if (!isFullySelectedReceiveAccount(receiveAccount)) {
            selectReceiveAccount();
            analyticsReportCallback('account-selection', 'continue');

            return;
        }

        await dispatch(
            exchangeThunks.selectQuoteThunk({
                quote: { ...candidateQuote, swapSlippage },
                timer,
                userConsent: waitForConsent,
                nextStep: () => {
                    clearExchangeFormQuoteData(form);
                    navigation.navigate(TradingStackRoutes.TradingExchangePreview);
                },
                onCancel: () => {},
            }),
        );
    };

    return {
        canProceed,
        candidateQuote,
        sendAccount,
        receiveAccount,
        isLoading,
        isConsentRequested,
        giveConsent,
        cancelConsent,
        selectReceiveAccount,
        selectQuote,
    };
};
