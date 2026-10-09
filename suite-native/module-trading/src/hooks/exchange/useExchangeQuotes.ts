import { useEffect, useRef } from 'react';
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
import { type AbortablePromise, type ExchangeFormType } from '@suite-native/trading-types';
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

    const latestFetchIdRef = useRef(0);

    useEffect(
        () => () => {
            latestFetchIdRef.current += 1;
        },
        [requestKey],
    );

    const fetchQuotes = (): AbortablePromise => {
        latestFetchIdRef.current += 1;
        const fetchId = latestFetchIdRef.current;
        let isAborted = false;
        let quotesPromise: AbortablePromise | undefined;

        const selectedAsset = getValues('sendAsset');
        invariant(selectedAsset, 'Asset is not defined');
        const network = cryptoIdToNetwork(selectedAsset.cryptoId);
        invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

        const formValues = tradingExchangeFormToTradingExchangeFormProps(getValues);
        const selectedSendAccount = getValues('sendAccount');
        const state = store.getState();

        const request = (async () => {
            const bitcoinExchangeFromAddress = selectedSendAccount
                ? await getBitcoinExchangeFromAddress({
                      account: selectedSendAccount,
                      btcSwapComposeTemplate: selectTradingBtcSwapComposeTemplate(state),
                      feeInfo: selectConvertedNetworkFeeInfo(state, selectedSendAccount.symbol),
                      sendCryptoAmount: formValues.outputs[0]?.amount ?? '',
                      shouldSendInSats,
                  })
                : undefined;

            // The request was aborted, the form changed or unmounted, or a newer request started while
            // the swap inputs were being composed.
            if (isAborted || fetchId !== latestFetchIdRef.current) {
                return undefined;
            }

            const payload: HandleExchangeRequestThunkProps = {
                formValues: bitcoinExchangeFromAddress
                    ? { ...formValues, fromAddress: bitcoinExchangeFromAddress }
                    : formValues,
                network,
                shouldSendInSats,
                composeRequestCallback: noop,
            };

            quotesPromise = dispatch(exchangeThunks.handleRequestThunk(payload));

            return quotesPromise;
        })();

        return Object.assign(request, {
            abort: (message?: string) => {
                isAborted = true;
                if (quotesPromise?.abort) {
                    quotesPromise.abort(message);
                }
            },
        });
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
