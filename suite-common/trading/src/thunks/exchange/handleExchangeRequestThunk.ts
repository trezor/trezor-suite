import { type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Network } from '@suite-common/wallet-config';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeQuotesRequest,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import {
    type HandleExchangeRequestThunkProps,
    type MinimalExchangeFormProps,
    type TradingExchangeType,
} from '../../types';
import { addIdsToQuotes, getNetworkDecimalsWithFallback } from '../../utils';
import { exchangeUtils } from '../../utils/exchange/exchangeUtils';
import { isReceiveAddressCoherent } from '../../utils/exchange/receiveAddressCoherence';

type GetQuotesRequest = {
    requestData: ExchangeTradeQuoteRequest;
    signal: AbortSignal | null;
};

const getQuotesRequest = ({ requestData, signal }: GetQuotesRequest) =>
    tradeApi.getExchangeQuotes(requestData, signal);

type GetQuoteRequestData = {
    formValues: MinimalExchangeFormProps;
    network: Network;
    shouldSendInSats: boolean | undefined;
};

export const getQuoteRequestData = ({
    formValues,
    network,
    shouldSendInSats,
}: GetQuoteRequestData): ExchangeTradeQuoteRequest | undefined => {
    const { outputs, receiveCryptoSelect, sendCryptoSelect, receiveAddress, fromAddress } =
        formValues;
    const decimals = getNetworkDecimalsWithFallback(network.symbol);

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstOutput: (typeof outputs)[number] = outputs[0];
    const unformattedOutputAmount = firstOutput.amount ?? '';
    const sendStringAmount =
        unformattedOutputAmount && shouldSendInSats
            ? convertAmountSubunitsToUnits(unformattedOutputAmount, decimals)
            : unformattedOutputAmount;

    if (
        !receiveCryptoSelect?.id ||
        !sendCryptoSelect?.id ||
        !sendStringAmount ||
        Number(sendStringAmount) === 0
    ) {
        return undefined;
    }

    const request: ExchangeTradeQuoteRequest = {
        receive: receiveCryptoSelect.id,
        send: sendCryptoSelect.id,
        sendStringAmount,
        dex: 'enable',
        receiveAddress,
        fromAddress,
    };

    return request;
};

export const handleExchangeRequestThunk = createThunk<
    ExchangeTrade[],
    HandleExchangeRequestThunkProps,
    {
        rejectValue: string;
    }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/handleRequest`,
    async (
        {
            formValues,
            network,
            shouldSendInSats,
            composeRequestCallback,
        }: HandleExchangeRequestThunkProps,
        { dispatch, getState, fulfillWithValue, rejectWithValue, signal, extra },
    ) => {
        const requestData = getQuoteRequestData({
            formValues,
            network,
            shouldSendInSats,
        });

        if (!requestData) {
            dispatch(tradingActions.stopRefetchQuotes());

            return rejectWithValue('Invalid request data');
        }

        const { receiveAccountKey } = formValues;
        const receiveAccount = receiveAccountKey
            ? selectAccountByKey(getState(), receiveAccountKey)
            : undefined;

        if (
            !isReceiveAddressCoherent({
                addressValidator: extra.services.addressValidator,
                receiveAddress: requestData.receiveAddress,
                receiveCryptoId: requestData.receive,
                receiveAccountKey,
                receiveAccountSymbol: receiveAccount?.symbol,
            })
        ) {
            dispatch(tradingActions.stopRefetchQuotes());

            return rejectWithValue('Invalid request data');
        }

        const currentQuotesRequest = selectTradingExchangeQuotesRequest(getState());
        if (currentQuotesRequest && requestData.receive !== currentQuotesRequest.receive) {
            dispatch(tradingExchangeActions.clearQuotes());
        }

        let allQuotes: ExchangeTrade[] = [];
        let requestSucceeded = false;
        try {
            allQuotes = (await getQuotesRequest({ requestData, signal })) ?? [];
            requestSucceeded = true;
        } finally {
            if (!requestSucceeded) {
                dispatch(tradingActions.stopRefetchQuotes());
            }
        }

        if (signal.aborted) {
            dispatch(tradingActions.stopRefetchQuotes());

            return rejectWithValue('Request was aborted');
        }

        if (!Array.isArray(allQuotes) || allQuotes.length === 0) {
            dispatch(tradingActions.stopRefetchQuotes());
            dispatch(tradingExchangeActions.saveQuotes([]));

            return fulfillWithValue([]);
        }

        const currency =
            selectTradingCoinSymbolByCryptoId(getState(), requestData.send) ?? requestData.send;
        const limits = exchangeUtils.getAmountLimits({ quotes: allQuotes, currency });

        const successQuotes = addIdsToQuotes<TradingExchangeType>(
            exchangeUtils.getSuccessQuotesOrdered(allQuotes),
            'exchange',
        );

        dispatch(tradingExchangeActions.setAmountLimits(limits));
        dispatch(tradingExchangeActions.saveQuotes(successQuotes));
        dispatch(tradingExchangeActions.saveQuoteRequest(requestData));

        const { setMaxOutputId } = formValues;

        // compose transaction only when is not computed from max balance
        // max balance has to be computed before request
        const shouldComposeRequest = setMaxOutputId === undefined && !limits;

        if (shouldComposeRequest) {
            composeRequestCallback();
        }

        dispatch(tradingActions.setRefetchQuotesTimestamp(Date.now()));

        return fulfillWithValue(successQuotes);
    },
);
