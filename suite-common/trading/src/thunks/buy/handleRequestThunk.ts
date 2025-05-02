import { BuyTrade, BuyTradeQuoteRequest } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Network } from '@suite-common/wallet-config';
import { formatAmount } from '@suite-common/wallet-utils';
import { Timer } from '@trezor/react-utils';

import { TRADING_BUY_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    selectTradingBuyQuotesRequest,
    selectTradingCoinSymbolByCryptoId,
} from '../../selectors/tradingSelectors';
import type { TradingBuyFormProps, TradingBuyType } from '../../types';
import {
    addIdsToQuotes,
    filterQuotesAccordingTags,
    getTradingNetworkDecimals,
    getTradingPaymentMethods,
    tradingGetSuccessQuotes,
} from '../../utils';
import { buyUtils } from '../../utils/buy/buyUtils';

export const BUY_THUNK_COMMON_PREFIX = '@trading-buy/thunk';

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
    const decimals = getTradingNetworkDecimals({ network });
    const cryptoStringAmount =
        cryptoInput && shouldSendInSats ? formatAmount(cryptoInput, decimals) : cryptoInput;

    const request = {
        wantCrypto: amountInCrypto,
        fiatCurrency: currencySelect
            ? currencySelect?.value.toUpperCase()
            : (quotesRequest?.fiatCurrency ?? ''),
        receiveCurrency: cryptoSelect?.value ?? quotesRequest?.receiveCurrency,
        country: countrySelect?.value ?? quotesRequest?.country,
        fiatStringAmount: fiatInput ?? quotesRequest?.fiatStringAmount,
        cryptoStringAmount: cryptoStringAmount ?? quotesRequest?.cryptoStringAmount,
    };

    // no need to fetch quotes if amount is not set
    if ((!request.fiatStringAmount && !request.cryptoStringAmount) || !request.receiveCurrency) {
        return undefined;
    }

    return request;
};

export type HandleRequestThunkProps = {
    formValues: TradingBuyFormProps;
    network: Network;
    timer: Timer;
    shouldSendInSats: boolean | undefined;
};

export const handleRequestThunk = createThunk<
    BuyTrade[],
    HandleRequestThunkProps,
    {
        rejectValue: string;
    }
>(
    `${TRADING_BUY_THUNK_PREFIX}/handleChange`,
    async (
        { formValues, network, timer, shouldSendInSats }: HandleRequestThunkProps,
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
        const paymentMethodsFromQuotes = getTradingPaymentMethods<TradingBuyType>(quotesSuccess);

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
