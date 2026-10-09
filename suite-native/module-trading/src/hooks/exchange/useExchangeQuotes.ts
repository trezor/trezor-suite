import { useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import {
    type HandleExchangeRequestThunkProps,
    cryptoIdToNetwork,
    exchangeThunks,
    selectTradingExchangeIsLoading,
} from '@suite-common/trading';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useFormState, useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { exchangeActions, selectExchangeQuotes } from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { noop } from '@trezor/utils';

import { tradingExchangeFormToTradingExchangeFormProps } from '../../utils/exchange/quotesUtils';
import { getReceiveAccountAddressText } from '../../utils/general/receiveAccountUtils';
import { getQuotesRequestKey, useQuotesRequest } from '../general/useQuotesRequest';

export const useExchangeQuotes = ({ getValues, control }: ExchangeFormType) => {
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const [sendAsset, receiveAsset, sendCryptoAmount, sendAccount, receiveAccount] = useWatch({
        control,
        name: ['sendAsset', 'receiveAsset', 'sendCryptoAmount', 'sendAccount', 'receiveAccount'],
    });
    const { isValid } = useFormState({ control });
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, getSymbolFromTradeableAsset(sendAsset)),
    );
    const quotes = useSelector(selectExchangeQuotes);
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const isFetchAllowed =
        isValid &&
        !!sendAsset &&
        !!receiveAsset &&
        !!sendCryptoAmount &&
        parseFloat(sendCryptoAmount) > 0;

    const requestKey = getQuotesRequestKey(isFetchAllowed, {
        sendAsset: sendAsset?.cryptoId,
        receiveAsset: receiveAsset?.cryptoId,
        sendCryptoAmount,
        sendAccountDescriptor: sendAccount?.descriptor,
        receiveAccountAddress: getReceiveAccountAddressText(receiveAccount),
    });

    const fetchQuotes = () => {
        const selectedAsset = getValues('sendAsset');
        invariant(selectedAsset, 'Asset is not defined');
        const network = cryptoIdToNetwork(selectedAsset.cryptoId);
        invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

        const payload: HandleExchangeRequestThunkProps = {
            formValues: tradingExchangeFormToTradingExchangeFormProps(getValues),
            network,
            shouldSendInSats,
            composeRequestCallback: noop,
        };

        return dispatch(exchangeThunks.handleRequestThunk(payload));
    };

    const reportQuotesReceived = () =>
        analytics.report({
            type: events.tradingQuoteReceivedEvent.name,
            payload: {
                type: 'exchange',
            },
        });

    useQuotesRequest({
        requestKey,
        fetchQuotes,
        onQuotesReceived: reportQuotesReceived,
        isLoading,
        hasQuotes: quotes.length > 0,
        clearQuotesAction: exchangeActions.clearQuotesAndQuotesRequest,
        clearStateAction: exchangeActions.clearState,
    });
};
