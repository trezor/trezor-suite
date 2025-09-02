import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { exchangeThunks, selectTradingExchangeIsLoading } from '@suite-common/trading';
import {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useTimer } from '@trezor/react-utils';

import { clearExchangeFormQuoteData } from './useExchangeForm';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '../../selectors/exchangeSelectors';
import { ExchangeFormType } from '../../types/exchange';
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

    const navigation = useNavigation<NavigationProps>();

    const [candidateQuote, receiveAsset] = form.watch(['quote', 'receiveAsset']);

    const { isConsentRequested, waitForConsent, resolveConsent } = useConsent();
    useConsentDenier(candidateQuote?.exchange, resolveConsent);

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

    const handleConsent = useMemo(
        () => ({
            give: () => resolveConsent(true),
            cancel: () => resolveConsent(false),
            request: () => waitForConsent(),
        }),
        [resolveConsent, waitForConsent],
    );

    const selectQuote = async () => {
        if (!candidateQuote || isLoading) {
            return;
        }

        if (!receiveAccount) {
            selectReceiveAccount();

            return;
        }

        await dispatch(
            exchangeThunks.selectQuoteThunk({
                quote: candidateQuote,
                timer,
                userConsent: handleConsent.request,
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
        selectReceiveAccount,
        selectQuote,
        giveConsent: handleConsent.give,
        cancelConsent: handleConsent.cancel,
    };
};
