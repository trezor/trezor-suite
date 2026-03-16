import { type RefObject, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';
import type { BuyTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    type HandleBuyRequestThunkProps,
    type TradingRootState,
    buyThunks,
    cryptoIdToNetwork,
    selectTradingBuyIsLoading,
    selectTradingCoinInfoByCryptoId,
    selectTradingPlatformByCryptoId,
} from '@suite-common/trading';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { buyActions, selectValidTradingBuyQuotesNative } from '@suite-native/trading-state';
import { type AbortablePromise, type BuyFormType } from '@suite-native/trading-types';
import { useDebounce } from '@trezor/react-utils';

import { tradingBuyFormToTradingBuyFormProps } from '../../utils/buy/quotesUtils';
import { useQuotesInvalidator } from '../general/useQuotesInvalidator';
import { useReloadTimer } from '../general/useReloadTimer';

type ShouldFetchBuyQuotesRef = {
    cryptoId: string | undefined;
    fiatCurrency: string | undefined;
    amount: string | undefined;
    amountInCrypto: boolean | undefined;
    country: string | undefined;
    accountDescriptor: string | undefined;
};

type ShouldFetchBuyQuotes = {
    isFetchAllowed: boolean;
    shouldFetchQuotes: boolean;
};

const useShouldFetchBuyQuotes = (form: BuyFormType): ShouldFetchBuyQuotes => {
    const prevState = useRef<ShouldFetchBuyQuotesRef>({
        cryptoId: undefined,
        fiatCurrency: undefined,
        amount: undefined,
        amountInCrypto: false,
        country: undefined,
        accountDescriptor: undefined,
    });

    const [asset, fiatCurrency, fiatValue, cryptoValue, amountInCrypto, country, receiveAccount] =
        form.watch([
            'asset',
            'fiatCurrency',
            'fiatValue',
            'cryptoValue',
            'amountInCrypto',
            'country',
            'receiveAccount',
        ]);

    const amount = amountInCrypto ? cryptoValue : fiatValue;
    const isFetchAllowed = !!(asset && fiatCurrency && amount && parseFloat(amount) > 0);

    if (
        asset?.cryptoId === prevState.current.cryptoId &&
        fiatCurrency === prevState.current.fiatCurrency &&
        amount === prevState.current.amount &&
        amountInCrypto === prevState.current.amountInCrypto &&
        country?.value === prevState.current.country &&
        receiveAccount?.account?.descriptor === prevState.current.accountDescriptor
    ) {
        return {
            isFetchAllowed,
            shouldFetchQuotes: false,
        };
    }

    prevState.current = {
        cryptoId: asset?.cryptoId,
        fiatCurrency,
        amount,
        amountInCrypto,
        country: country?.value,
        accountDescriptor: receiveAccount?.account?.descriptor,
    };

    return {
        isFetchAllowed,
        shouldFetchQuotes: true,
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
    timer: ReturnType<typeof useReloadTimer>['timer'],
    shouldRefetchQuotes: boolean,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const asset = form.watch('asset');
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

    useEffect(() => {
        if (shouldRefetchQuotes) {
            if (quotesPromiseRef.current?.abort) {
                quotesPromiseRef.current.abort('Request was replaced by another one.');
            }

            debounce(async () => {
                const selectedAsset = form.getValues('asset');
                invariant(selectedAsset, 'Asset is not defined');
                const network = cryptoIdToNetwork(selectedAsset.cryptoId);
                invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

                const payload: HandleBuyRequestThunkProps = {
                    network,
                    formValues: tradingBuyFormToTradingBuyFormProps(form, coinInfo, platformInfo),
                    shouldSendInSats,
                    timer,
                };
                const requestPromise = dispatch(buyThunks.handleRequestThunk(payload));
                quotesPromiseRef.current = requestPromise;
                const action = await requestPromise;
                if (isFulfilled(action) && (action.payload as BuyTrade[]).length > 0) {
                    analytics.report({
                        type: events.tradingQuoteReceivedEvent.name,
                        payload: {
                            type: 'buy',
                        },
                    });
                }
            });
        }
    }, [
        form,
        shouldRefetchQuotes,
        timer,
        quotesPromiseRef,
        shouldSendInSats,
        coinInfo,
        platformInfo,
        debounce,
        dispatch,
        analytics,
    ]);
};

export const useBuyQuotes = (form: BuyFormType) => {
    const debounce = useDebounce();
    const promiseRef = useRef<AbortablePromise | undefined>(undefined);

    const { isFetchAllowed, shouldFetchQuotes } = useShouldFetchBuyQuotes(form);
    const { timer, shouldReload } = useReloadTimer({ isEnabled: isFetchAllowed });

    useBuyQuotesInvalidator(isFetchAllowed, promiseRef, debounce);
    useBuyQuotesThunk(
        form,
        timer,
        isFetchAllowed && (shouldFetchQuotes || shouldReload),
        promiseRef,
        debounce,
    );

    return {
        timer,
        quotesRequest: promiseRef.current,
    };
};
