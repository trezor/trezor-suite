import { ExchangeTrade, ExchangeTradeQuoteRequest } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Network } from '@suite-common/wallet-config';
import { formatAmount } from '@suite-common/wallet-utils';
import { Timer } from '@trezor/react-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { selectTradingCoinSymbolByCryptoId } from '../../selectors/tradingSelectors';
import { TradingExchangeFormProps, TradingExchangeType } from '../../types';
import { addIdsToQuotes, getTradingNetworkDecimals } from '../../utils';
import { exchangeUtils } from '../../utils/exchange/exchangeUtils';

type GetQuotesRequest = {
    requestData: ExchangeTradeQuoteRequest;
    signal: AbortSignal | null;
};

const getQuotesRequest = ({ requestData, signal }: GetQuotesRequest) =>
    invityAPI.getExchangeQuotes(requestData, signal);

type GetQuoteRequestData = {
    formValues: TradingExchangeFormProps;
    network: Network;
    shouldSendInSats: boolean | undefined;
};

export const getQuoteRequestData = ({
    formValues,
    network,
    shouldSendInSats,
}: GetQuoteRequestData): ExchangeTradeQuoteRequest | undefined => {
    const { outputs, receiveCryptoSelect, sendCryptoSelect } = formValues;
    const decimals = getTradingNetworkDecimals({ network });

    const unformattedOutputAmount = outputs[0].amount ?? '';
    const sendStringAmount =
        unformattedOutputAmount && shouldSendInSats
            ? formatAmount(unformattedOutputAmount, decimals)
            : unformattedOutputAmount;

    if (
        !receiveCryptoSelect?.value ||
        !sendCryptoSelect?.value ||
        !sendStringAmount ||
        Number(sendStringAmount) === 0
    ) {
        return undefined;
    }

    const request: ExchangeTradeQuoteRequest = {
        receive: receiveCryptoSelect.value,
        send: sendCryptoSelect.value,
        sendStringAmount,
        dex: 'enable',
    };

    return request;
};

export type HandleRequestThunkProps = {
    formValues: TradingExchangeFormProps;
    network: Network;
    timer: Timer;
    shouldSendInSats: boolean | undefined;
    composeRequestCallback: () => void;
};

export const handleRequestThunk = createThunk<
    ExchangeTrade[],
    HandleRequestThunkProps,
    {
        rejectValue: string;
    }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/handleChange`,
    async (
        {
            formValues,
            network,
            timer,
            shouldSendInSats,
            composeRequestCallback,
        }: HandleRequestThunkProps,
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
