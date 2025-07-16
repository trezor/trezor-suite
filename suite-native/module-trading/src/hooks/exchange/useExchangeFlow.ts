import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectTradingExchangeIsLoading,
    selectTradingExchangeReceiveAccountKey,
} from '@suite-common/trading';
import {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

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

export const useExchangeFlow = (form: ExchangeFormType) => {
    // TODO: this is stub to enable showing the legal sheet, we need to implement the logic for the exchange flow

    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);

    const navigation = useNavigation<NavigationProps>();

    const [isConsentRequested, setIsConsentRequested] = useState(false);

    const [candidateQuote, receiveAsset] = form.watch(['quote', 'receiveAsset']);

    const canProceed = !isLoading && !!candidateQuote;

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
            request: async () => {
                setIsConsentRequested(true);

                return await waitForConsent();
            },
        }),
        [],
    );

    const selectQuote = () => {
        if (!candidateQuote || isLoading) {
            return;
        }

        if (!receiveAccountKey) {
            selectReceiveAccount();

            return;
        }
        // TODO: implement logic

        setIsConsentRequested(false);
    };

    const confirmTrade = () => {
        // TODO: implement logic
    };

    return {
        canProceed,
        selectQuote,
        confirmTrade,
        isConsentRequested,
        giveConsent: handleConsent.give,
        cancelConsent: handleConsent.cancel,
    };
};
