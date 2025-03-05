import { MutableRefObject } from 'react';

import { BuyTradeQuoteRequest } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { Network } from '@suite-common/wallet-config';
import { formatAmount } from '@suite-common/wallet-utils';
import { Timer } from '@trezor/react-utils';

import { tradingBuyActions } from '../../actions/buyActions';
import { tradingActions } from '../../actions/tradingActions';
import { invityAPI } from '../../invityAPI';
import {
    cryptoIdToCoinSymbol,
    selectTradingBuyQuotesRequest,
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
    abortControllerRef: MutableRefObject<AbortController | null>;
};

const getQuotesRequest = async ({ requestData, abortControllerRef }: GetQuotesRequest) => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const allQuotes = await invityAPI.getBuyQuotes(requestData, abortControllerRef.current.signal);

    return allQuotes;
};

type GetQuoteRequestData = {
    formValues: TradingBuyFormProps;
    quotesRequest: BuyTradeQuoteRequest | undefined;
    network: Network;
    shouldSendInSats: boolean;
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
            : quotesRequest?.fiatCurrency ?? '',
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
    turnOffLoading: boolean;
    network: Network;
    timer: Timer;
    shouldSendInSats: boolean;
    abortControllerRef: MutableRefObject<AbortController | null>;
};

export const handleRequestThunk = createThunk(
    `${BUY_THUNK_COMMON_PREFIX}/handleChange`,
    async (
        {
            formValues,
            turnOffLoading,
            network,
            timer,
            shouldSendInSats,
            abortControllerRef,
        }: HandleRequestThunkProps,
        { dispatch, getState },
    ) => {
        timer.loading();
        dispatch(tradingBuyActions.setIsLoading(!turnOffLoading));

        const quotesRequest = selectTradingBuyQuotesRequest(getState());
        const requestData = getQuoteRequestData({
            formValues,
            quotesRequest,
            network,
            shouldSendInSats,
        });

        if (!requestData) {
            timer.stop();
            dispatch(tradingBuyActions.setIsLoading(false));

            return;
        }

        const allQuotes = await getQuotesRequest({
            requestData,
            abortControllerRef,
        });

        if (!Array.isArray(allQuotes) || allQuotes.length === 0) {
            timer.stop();
            dispatch(tradingBuyActions.saveQuotes([]));
            dispatch(tradingBuyActions.setIsLoading(false));

            return;
        }

        // processed quotes and without alternative quotes
        const quotesDefault = filterQuotesAccordingTags<TradingBuyType>(
            addIdsToQuotes<TradingBuyType>(allQuotes, 'buy'),
        );
        // without errors
        const quotesSuccess = tradingGetSuccessQuotes<TradingBuyType>(quotesDefault) ?? [];
        const paymentMethodsFromQuotes = getTradingPaymentMethods<TradingBuyType>(quotesSuccess);

        const symbol =
            cryptoIdToCoinSymbol(getState(), requestData.receiveCurrency) ??
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
        dispatch(tradingBuyActions.setIsLoading(false));

        timer.reset();
    },
);
