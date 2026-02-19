import { BuyTrade, BuyTradeQuoteRequest } from 'invity-api';

import { isCountrySubdivisionEmpty } from '@suite-common/geolocation';
import { createThunk } from '@suite-common/redux-utils';
import { Network } from '@suite-common/wallet-config';
import { convertAmountSubunitsToUnits } from '@suite-common/wallet-utils';

import { TRADING_BUY_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingBuyQuotesRequest,
    selectTradingCoinSymbolByCryptoId,
} from '../../selectors/tradingSelectors';
import type { HandleBuyRequestThunkProps, TradingBuyFormProps, TradingBuyType } from '../../types';
import {
    addIdsToQuotes,
    filterQuotesAccordingTags,
    getNetworkDecimalsWithFallback,
    getTradingPaymentMethods,
    tradingGetSuccessQuotes,
} from '../../utils';
import { buyUtils } from '../../utils/buy/buyUtils';

type GetQuotesRequest = {
    requestData: BuyTradeQuoteRequest;
    signal: AbortSignal | null;
};

const getQuotesRequest = ({ requestData, signal }: GetQuotesRequest) =>
    invityAPI.getBuyQuotes(requestData, signal);

type GetQuoteRequestData = {
    formValues: TradingBuyFormProps;
    quotesRequest: BuyTradeQuoteRequest | undefined;
    network: Network;
    shouldSendInSats: boolean | undefined;
};

const getQuoteRequestData = ({
    formValues,
    quotesRequest,
    network,
    shouldSendInSats,
}: GetQuoteRequestData): BuyTradeQuoteRequest | undefined => {
    const { fiatInput, cryptoInput, currencySelect, cryptoSelect, countrySelect, amountInCrypto } =
        formValues;

    const decimals = getNetworkDecimalsWithFallback(network.symbol);
    const cryptoStringAmount =
        cryptoInput && shouldSendInSats
            ? convertAmountSubunitsToUnits(cryptoInput, decimals)
            : cryptoInput;

    const request = {
        wantCrypto: amountInCrypto,
        fiatCurrency: currencySelect
            ? currencySelect?.value.toUpperCase()
            : (quotesRequest?.fiatCurrency ?? ''),
        receiveCurrency: cryptoSelect?.id ?? quotesRequest?.receiveCurrency,
        country: countrySelect?.value ?? quotesRequest?.country,
        fiatStringAmount: fiatInput ?? quotesRequest?.fiatStringAmount,
        cryptoStringAmount: cryptoStringAmount ?? quotesRequest?.cryptoStringAmount,
    };

    // no need to fetch quotes if amount is not set
    if ((!request.fiatStringAmount && !request.cryptoStringAmount) || !request.receiveCurrency) {
        return undefined;
    }

    // do not fetch quotes until subdivision is set when country has subdivisions
    if (isCountrySubdivisionEmpty(request.country, formValues.countrySubdivisionSelect?.value)) {
        return undefined;
    }

    return {
        ...request,
        subdivision: formValues.countrySubdivisionSelect?.value,
    };
};

export const handleBuyRequestThunk = createThunk<
    BuyTrade[],
    HandleBuyRequestThunkProps,
    {
        rejectValue: string;
    }
>(
    `${TRADING_BUY_THUNK_PREFIX}/handleRequest`,
    async (
        { formValues, network, timer, shouldSendInSats }: HandleBuyRequestThunkProps,
        { dispatch, getState, fulfillWithValue, rejectWithValue, signal },
    ) => {
        timer.loading();

        const quotesRequest = selectTradingBuyQuotesRequest(getState());

        const requestData = getQuoteRequestData({
            formValues,
            quotesRequest,
            network,
            shouldSendInSats,
        });

        if (!requestData) {
            timer.stop();

            return rejectWithValue('Invalid request data');
        }

        const allQuotes = await getQuotesRequest({
            requestData,
            signal,
        });

        if (signal.aborted) {
            timer.reset();

            return rejectWithValue('Request was aborted');
        }

        if (!Array.isArray(allQuotes) || allQuotes.length === 0) {
            timer.stop();

            const quotesSuccess: BuyTrade[] = [];
            dispatch(tradingBuyActions.setAmountLimits(undefined));
            dispatch(tradingBuyActions.saveQuotes(quotesSuccess));
            dispatch(tradingBuyActions.saveQuoteRequest(requestData));
            dispatch(tradingActions.savePaymentMethods([]));

            return fulfillWithValue(quotesSuccess);
        }

        // processed quotes and without alternative quotes
        const quotesDefault = filterQuotesAccordingTags<TradingBuyType>(
            addIdsToQuotes<TradingBuyType>(allQuotes, 'buy'),
        );
        // without errors
        const quotesSuccess = tradingGetSuccessQuotes<TradingBuyType>(quotesDefault);
        const paymentMethodsFromQuotes = getTradingPaymentMethods(quotesSuccess);

        const symbol =
            selectTradingCoinSymbolByCryptoId(getState(), requestData.receiveCurrency) ??
            requestData.receiveCurrency;
        const limits = buyUtils.getAmountLimits({
            request: requestData,
            quotes: quotesDefault,
            currency: symbol,
        }); // from all quotes except alternative

        dispatch(tradingBuyActions.setAmountLimits(limits));
        dispatch(tradingBuyActions.saveQuotes(quotesSuccess));
        dispatch(tradingBuyActions.saveQuoteRequest(requestData));
        dispatch(tradingActions.savePaymentMethods(paymentMethodsFromQuotes));

        timer.reset();

        return fulfillWithValue(quotesSuccess);
    },
);
