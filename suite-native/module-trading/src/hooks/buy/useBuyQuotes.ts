import { type RefObject, useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { useServices } from '@suite-common/dependency-injection';
import { invariant } from '@suite-common/suite-utils';
import {
    type HandleBuyRequestThunkProps,
    type TradingRootState,
    buyThunks,
    cryptoIdToNetwork,
    selectTradingBuyIsLoading,
    selectTradingCoinInfoByCryptoId,
    selectTradingPlatformByCryptoId,
    useTradingRefetchScheduler,
} from '@suite-common/trading';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { buyActions, selectValidTradingBuyQuotesNative } from '@suite-native/trading-state';
import { type AbortablePromise, type BuyFormType } from '@suite-native/trading-types';
import { useDebounce } from '@trezor/react-utils';

import { tradingBuyFormToTradingBuyFormProps } from '../../utils/buy/quotesUtils';
import { getReceiveAccountAddressText } from '../../utils/general/receiveAccountUtils';
import { useQuotesInvalidator } from '../general/useQuotesInvalidator';

type BuyQuoteRequestState = {
    isFetchAllowed: boolean;
    cryptoId: string | undefined;
    fiatCurrency: string | undefined;
    amount: string | undefined;
    amountInCrypto: boolean | undefined;
    country: string | undefined;
    countrySubdivision: string | undefined;
    receiveAccountAddress: string | undefined;
};

const useBuyQuoteRequestState = ({ control }: BuyFormType): BuyQuoteRequestState => {
    const [
        asset,
        fiatCurrency,
        fiatValue,
        cryptoValue,
        amountInCrypto,
        country,
        countrySubdivision,
        receiveAccount,
    ] = useWatch({
        control,
        name: [
            'asset',
            'fiatCurrency',
            'fiatValue',
            'cryptoValue',
            'amountInCrypto',
            'country',
            'countrySubdivision',
            'receiveAccount',
        ],
    });

    const amount = amountInCrypto ? cryptoValue : fiatValue;
    const isFetchAllowed = !!(asset && fiatCurrency && amount && parseFloat(amount) > 0);

    return {
        isFetchAllowed,
        cryptoId: asset?.cryptoId,
        fiatCurrency,
        amount,
        amountInCrypto,
        country: country?.value,
        countrySubdivision: countrySubdivision?.value,
        receiveAccountAddress: getReceiveAccountAddressText(receiveAccount),
    };
};

const useBuyQuotesInvalidator = (
    isFormValid: boolean,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const quotes = useSelector(selectValidTradingBuyQuotesNative);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    useQuotesInvalidator({
        isFormValid,
        isLoading,
        anyQuotesLoaded: quotes.length > 0,
        quotesPromiseRef,
        debounce,
        getClearRequestAction: buyActions.clearQuotesAndQuotesRequest,
        getClearStateAction: buyActions.clearState,
    });
};

const useBuyQuotesThunk = (
    form: BuyFormType,
    requestState: BuyQuoteRequestState,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const asset = useWatch({ control: form.control, name: 'asset' });
    const symbol = getSymbolFromTradeableAsset(asset);
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, asset?.cryptoId),
    );
    const platformInfo = useSelector((state: TradingRootState) =>
        selectTradingPlatformByCryptoId(state, asset?.cryptoId),
    );
    const {
        isFetchAllowed,
        cryptoId,
        fiatCurrency,
        amount,
        amountInCrypto,
        country,
        countrySubdivision,
        receiveAccountAddress,
    } = requestState;

    const fetchQuotes = useCallback(async () => {
        const selectedAsset = form.getValues('asset');
        invariant(selectedAsset, 'Asset is not defined');
        const network = cryptoIdToNetwork(selectedAsset.cryptoId);
        invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

        const payload: HandleBuyRequestThunkProps = {
            network,
            formValues: tradingBuyFormToTradingBuyFormProps(form, coinInfo, platformInfo),
            shouldSendInSats,
        };
        const requestPromise = dispatch(buyThunks.handleRequestThunk(payload));
        quotesPromiseRef.current = requestPromise;
        const action = await requestPromise;
        if (isFulfilled(action) && action.payload.length > 0) {
            analytics.report({
                type: events.tradingQuoteReceivedEvent.name,
                payload: {
                    type: 'buy',
                },
            });
        }
    }, [form, coinInfo, platformInfo, shouldSendInSats, quotesPromiseRef, dispatch, analytics]);

    const requestQuotes = useEffectEvent(() => {
        if (quotesPromiseRef.current?.abort) {
            quotesPromiseRef.current.abort('Request was replaced by another one.');
        }

        debounce(fetchQuotes);
    });

    useEffect(() => {
        if (!isFetchAllowed) {
            return;
        }

        requestQuotes();
    }, [
        isFetchAllowed,
        cryptoId,
        fiatCurrency,
        amount,
        amountInCrypto,
        country,
        countrySubdivision,
        receiveAccountAddress,
    ]);

    useTradingRefetchScheduler({
        onRefetch: () => {
            if (!isFetchAllowed) return;
            debounce(fetchQuotes);
        },
    });
};

export const useBuyQuotes = (form: BuyFormType) => {
    const debounce = useDebounce();
    const promiseRef = useRef<AbortablePromise | undefined>(undefined);

    const requestState = useBuyQuoteRequestState(form);

    useBuyQuotesInvalidator(requestState.isFetchAllowed, promiseRef, debounce);
    useBuyQuotesThunk(form, requestState, promiseRef, debounce);
};
