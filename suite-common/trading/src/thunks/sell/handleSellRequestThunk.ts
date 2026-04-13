import { type SellFiatTrade, type SellFiatTradeQuoteRequest } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { type Network } from '@suite-common/wallet-config';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';
import { isNative } from '@trezor/env-utils';

import { TRADING_DEFAULT_SELL_FLOWS, TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import { selectTradingCoinSymbolByCryptoId } from '../../selectors/tradingSelectors';
import {
    type HandleSellRequestThunkProps,
    type MinimalSellFormProps,
    type TradingSellType,
} from '../../types';
import {
    addIdsToQuotes,
    filterQuotesAccordingTags,
    getNetworkDecimalsWithFallback,
    getTradingPaymentMethods,
    tradingGetSuccessQuotes,
} from '../../utils';
import { hasCountrySubdivisions, isCountryCode } from '../../utils/countryUtils';
import { sellUtils } from '../../utils/sell/sellUtils';

type GetQuotesRequest = {
    requestData: SellFiatTradeQuoteRequest;
    signal: AbortSignal | null;
};

const getQuotesRequest = ({ requestData, signal }: GetQuotesRequest) =>
    invityAPI.getSellQuotes(requestData, signal);

type GetQuoteRequestData = {
    formValues: MinimalSellFormProps;
    network: Network;
    shouldSendInSats: boolean | undefined;
};

const getQuoteRequestData = ({
    formValues,
    network,
    shouldSendInSats,
}: GetQuoteRequestData): SellFiatTradeQuoteRequest | null => {
    const { outputs, countrySelect, sendCryptoSelect, amountInCrypto } = formValues;
    const decimals = getNetworkDecimalsWithFallback(network.symbol);

    const fiatStringAmount = outputs[0].fiat;
    const unformattedOutputAmount = outputs[0].amount;
    const cryptoStringAmount =
        unformattedOutputAmount && shouldSendInSats
            ? convertAmountSubunitsToUnits(unformattedOutputAmount, decimals)
            : unformattedOutputAmount;
    const currencySelect = outputs[0].currency;

    if (
        (!fiatStringAmount && (!cryptoStringAmount || Number(cryptoStringAmount) === 0)) ||
        !currencySelect?.value ||
        !sendCryptoSelect
    ) {
        return null;
    }

    const request = {
        amountInCrypto,
        cryptoCurrency: sendCryptoSelect.id,
        fiatCurrency: currencySelect.value.toUpperCase(),
        country: countrySelect.value,
        subdivision: formValues.countrySubdivisionSelect?.value,
        cryptoStringAmount,
        fiatStringAmount,
        flows: TRADING_DEFAULT_SELL_FLOWS,
    };

    // do not fetch quotes until subdivision is set when country has subdivisions
    if (
        !isNative() && // todo: subdivisions are not yet implemented for mobile, should be removed in #24188
        request.country &&
        isCountryCode(request.country) &&
        hasCountrySubdivisions(request.country) &&
        !formValues.countrySubdivisionSelect?.value
    ) {
        return null;
    }

    return request;
};

export const handleSellRequestThunk = createThunk<
    SellFiatTrade[],
    HandleSellRequestThunkProps,
    {
        rejectValue: string;
    }
>(
    `${TRADING_SELL_THUNK_PREFIX}/handleRequest`,
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

        const paymentMethodsFromQuotes = getTradingPaymentMethods(successQuotes);

        dispatch(tradingSellActions.saveQuotes(successQuotes));
        dispatch(tradingSellActions.saveQuoteRequest(requestData));
        dispatch(tradingActions.savePaymentMethods(paymentMethodsFromQuotes));
        dispatch(tradingSellActions.setAmountLimits(limits));

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
