import { type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Network } from '@suite-common/wallet-config';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { selectTradingCoinSymbolByCryptoId } from '../../selectors/tradingSelectors';
import {
    type HandleExchangeRequestThunkProps,
    type MinimalExchangeFormProps,
    type TradingExchangeType,
} from '../../types';
import { addIdsToQuotes, getNetworkDecimalsWithFallback } from '../../utils';
import { exchangeUtils } from '../../utils/exchange/exchangeUtils';

type GetQuotesRequest = {
    requestData: ExchangeTradeQuoteRequest;
    signal: AbortSignal | null;
};

const getQuotesRequest = ({ requestData, signal }: GetQuotesRequest) =>
    invityAPI.getExchangeQuotes(requestData, signal);

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

    const unformattedOutputAmount = outputs[0].amount ?? '';
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
            timer,
            shouldSendInSats,
            composeRequestCallback,
        }: HandleExchangeRequestThunkProps,
        { dispatch, getState, fulfillWithValue, rejectWithValue, signal },
    ) => {
        timer.loading();

        const requestData = getQuoteRequestData({
            formValues,
            network,
            shouldSendInSats,
        });

        if (!requestData) {
            timer.stop();

            return rejectWithValue('Invalid request data');
        }

        const allQuotes = await getQuotesRequest({ requestData, signal });

        if (signal.aborted) {
            timer.reset();

            return rejectWithValue('Request was aborted');
        }

        if (!Array.isArray(allQuotes) || allQuotes.length === 0) {
            timer.stop();
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

        timer.reset();

        return fulfillWithValue(successQuotes);
    },
);
