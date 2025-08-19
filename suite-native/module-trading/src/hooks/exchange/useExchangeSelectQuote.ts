import { useMemo, useState } from 'react';
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

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

let consentResolver: ((confirmed: boolean) => void) | null = null;

const waitForConsent = (): Promise<boolean> =>
    new Promise(resolve => {
        consentResolver = resolve;
    });

const resolveConsent = (confirmed: boolean) => {
    consentResolver?.(confirmed);
    consentResolver = null;
};

export const useExchangeSelectQuote = (form: ExchangeFormType) => {
    const dispatch = useDispatch();
    const timer = useTimer();

    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const receiveAccount = useSelector(selectExchangeSelectedReceiveAccount);

    const navigation = useNavigation<NavigationProps>();

    const [candidateQuote, receiveAsset] = form.watch(['quote', 'receiveAsset']);
    const [isConsentRequested, setIsConsentRequested] = useState(false);

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
            give: () => {
                resolveConsent(true);
                setIsConsentRequested(false);
            },
            cancel: () => {
                resolveConsent(false);
                setIsConsentRequested(false);
            },
            request: () => {
                setIsConsentRequested(true);

                return waitForConsent();
            },
        }),
        [],
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
