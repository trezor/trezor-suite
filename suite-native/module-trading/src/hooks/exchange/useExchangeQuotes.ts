import { useSelector, useStore } from 'react-redux';

import { injectDispatch } from '@suite-common/redux-utils';
import { invariant } from '@suite-common/suite-utils';
import {
    type HandleExchangeRequestThunkProps,
    type TradingRootState,
    cryptoIdToNetwork,
    exchangeThunks,
    selectTradingBtcSwapComposeTemplate,
    selectTradingExchangeIsLoading,
} from '@suite-common/trading';
import {
    type FeesRootState,
    type WalletSettingsRootState,
    selectConvertedNetworkFeeInfo,
    selectIsAmountInSats,
} from '@suite-common/wallet-core';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useFormState, useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { exchangeActions, selectExchangeQuotes } from '@suite-native/trading-state';
import { type ExchangeFormType } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';
import { noop } from '@trezor/utils';

import { getBitcoinExchangeFromAddress } from '../../utils/exchange/bitcoinExchangeUtils';
import { tradingExchangeFormToTradingExchangeFormProps } from '../../utils/exchange/quotesUtils';
import { getReceiveAccountAddressText } from '../../utils/general/receiveAccountUtils';
import { getQuotesRequestKey, useQuotesRequest } from '../general/useQuotesRequest';

export const useExchangeQuotes = ({ getValues, control }: ExchangeFormType) => {
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const store = useStore<TradingRootState & FeesRootState>();
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

        const formValues = tradingExchangeFormToTradingExchangeFormProps(getValues);
        const selectedSendAccount = getValues('sendAccount');
        const state = store.getState();

        const payload: HandleExchangeRequestThunkProps = {
            formValues,
            network,
            shouldSendInSats,
            composeRequestCallback: noop,
            resolveFromAddress:
                selectedSendAccount?.networkType === 'bitcoin'
                    ? () =>
                          getBitcoinExchangeFromAddress({
                              account: selectedSendAccount,
                              btcSwapComposeTemplate: selectTradingBtcSwapComposeTemplate(state),
                              feeInfo: selectConvertedNetworkFeeInfo(
                                  state,
                                  selectedSendAccount.symbol,
                              ),
                              sendCryptoAmount: formValues.outputs[0]?.amount ?? '',
                              shouldSendInSats,
                          })
                    : undefined,
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
