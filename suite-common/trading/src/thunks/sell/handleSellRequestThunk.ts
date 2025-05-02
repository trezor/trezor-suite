import { SellFiatFlowType, SellFiatTrade, SellFiatTradeQuoteRequest } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Network } from '@suite-common/wallet-config';
import { formatAmount } from '@suite-common/wallet-utils';
import { Timer } from '@trezor/react-utils';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import { selectTradingCoinSymbolByCryptoId } from '../../selectors/tradingSelectors';
import { TradingSellFormProps, TradingSellType } from '../../types';
import {
    addIdsToQuotes,
    filterQuotesAccordingTags,
    getTradingNetworkDecimals,
    getTradingPaymentMethods,
    tradingGetSuccessQuotes,
} from '../../utils';
import { sellUtils } from '../../utils/sell/sellUtils';

type GetQuotesRequest = {
    requestData: SellFiatTradeQuoteRequest;
    signal: AbortSignal | null;
};

const getQuotesRequest = ({ requestData, signal }: GetQuotesRequest) =>
    invityAPI.getSellQuotes(requestData, signal);

type GetQuoteRequestData = {
    formValues: TradingSellFormProps;
    network: Network;
    shouldSendInSats: boolean | undefined;
};

const getQuoteRequestData = ({
    formValues,
    network,
    shouldSendInSats,
}: GetQuoteRequestData): SellFiatTradeQuoteRequest | null => {
    const { outputs, countrySelect, sendCryptoSelect, amountInCrypto } = formValues;
    const decimals = getTradingNetworkDecimals({ network, sendCryptoSelect });

    const flows: SellFiatFlowType[] = ['BANK_ACCOUNT', 'PAYMENT_GATE'];
    const fiatStringAmount = outputs[0].fiat;
    const unformattedOutputAmount = outputs[0].amount;
    const cryptoStringAmount =
        unformattedOutputAmount && shouldSendInSats
            ? formatAmount(unformattedOutputAmount, decimals)
            : unformattedOutputAmount;
    const currencySelect = outputs[0].currency;

    if (
        (!fiatStringAmount && (!cryptoStringAmount || Number(cryptoStringAmount) === 0)) ||
        !currencySelect ||
        !sendCryptoSelect
    ) {
        return null;
    }

    const request = {
        amountInCrypto,
        cryptoCurrency: sendCryptoSelect.value,
        fiatCurrency: currencySelect.value.toUpperCase(),
        country: countrySelect.value,
        cryptoStringAmount,
        fiatStringAmount,
        flows,
    };

    return request;
};

export type HandleSellRequestThunkProps = {
    formValues: TradingSellFormProps;
    network: Network;
    timer: Timer;
    shouldSendInSats: boolean | undefined;
    composeRequestCallback: () => void;
};

export const handleSellRequestThunk = createThunk<
    SellFiatTrade[],
    HandleSellRequestThunkProps,
    {
        rejectValue: string;
    }
>(
    `${TRADING_SELL_THUNK_PREFIX}/handleChange`,
    async (
        {
            formValues,
            network,
            timer,
            shouldSendInSats,
            composeRequestCallback,
        }: HandleSellRequestThunkProps,
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

            const quotesSuccess: SellFiatTrade[] = [];
            dispatch(tradingSellActions.setAmountLimits(undefined));
            dispatch(tradingSellActions.saveQuotes(quotesSuccess));
            dispatch(tradingSellActions.saveQuoteRequest(requestData));
            dispatch(tradingActions.savePaymentMethods([]));

            return fulfillWithValue(quotesSuccess);
        }

        const currency =
            selectTradingCoinSymbolByCryptoId(getState(), requestData.cryptoCurrency) ??
            requestData.cryptoCurrency;
        const limits = sellUtils.getAmountLimits({
            request: requestData,
            quotes: allQuotes,
            currency,
        });

        const quotesDefault = filterQuotesAccordingTags<TradingSellType>(
            addIdsToQuotes<TradingSellType>(allQuotes, 'sell'),
        );
        // without errors
        const successQuotes = tradingGetSuccessQuotes<TradingSellType>(quotesDefault);

        const paymentMethodsFromQuotes = getTradingPaymentMethods<TradingSellType>(successQuotes);

        dispatch(tradingSellActions.saveQuotes(successQuotes));
        dispatch(tradingSellActions.saveQuoteRequest(requestData));
        dispatch(tradingActions.savePaymentMethods(paymentMethodsFromQuotes));
        dispatch(tradingSellActions.setAmountLimits(limits));

        const { setMaxOutputId } = formValues;

        // compose transaction only when is not computed from max balance
        // max balance has to be computed before request
        if (setMaxOutputId === undefined && !limits) {
            composeRequestCallback();
        }

        timer.reset();

        return fulfillWithValue(successQuotes);
    },
);
