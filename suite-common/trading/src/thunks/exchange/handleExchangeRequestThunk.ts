import { type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
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
    account: Account;
    shouldSendInSats: boolean | undefined;
};

const getQuoteRequestData = async ({
    formValues,
    network,
    account,
    shouldSendInSats,
}: GetQuoteRequestData): Promise<ExchangeTradeQuoteRequest | undefined> => {
    const { outputs, receiveCryptoSelect, sendCryptoSelect, receiveAddress } = formValues;
    const decimals = getNetworkDecimalsWithFallback(network.symbol);

    const unformattedOutputAmount = outputs[0].amount ?? '';
    const sendStringAmount =
        unformattedOutputAmount && shouldSendInSats
            ? convertAmountSubunitsToUnits(unformattedOutputAmount, decimals)
            : unformattedOutputAmount;

    const { setMaxOutputId } = formValues;

    if (
        !receiveCryptoSelect?.id ||
        !sendCryptoSelect?.id ||
        ((!sendStringAmount || Number(sendStringAmount) === 0) && setMaxOutputId === undefined)
    ) {
        return undefined;
    }

    let { fromAddress } = formValues;
    let finalSendStringAmount = sendStringAmount;

    if (network.networkType === 'bitcoin') {
        const bitcoinSwapData = await exchangeUtils.deriveBitcoinSwapFromAddresses({
            account,
            network,
            sendStringAmount,
            decimals,
            setMaxOutputId,
        });
        if (bitcoinSwapData) {
            fromAddress = bitcoinSwapData.addresses.join(';');
            if (bitcoinSwapData.amount && setMaxOutputId === 0) {
                finalSendStringAmount = convertAmountSubunitsToUnits(bitcoinSwapData.amount, decimals);
            }
        }
    }

    const request: ExchangeTradeQuoteRequest = {
        receive: receiveCryptoSelect.id,
        send: sendCryptoSelect.id,
        sendStringAmount: finalSendStringAmount,
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
            account,
            timer,
            shouldSendInSats,
            composeRequestCallback,
        }: HandleExchangeRequestThunkProps,
        { dispatch, getState, fulfillWithValue, rejectWithValue, signal },
    ) => {
        timer.loading();

        const requestData = await getQuoteRequestData({
            formValues,
            network,
            account,
            shouldSendInSats,
        });

        if (!requestData) {
            dispatch(tradingActions.stopRefetchQuotes());

            return rejectWithValue('Invalid request data');
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
