import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';
import { BuyTrade } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    type HandleBuyRequestThunkProps,
    TradingRootState,
    buyThunks,
    cryptoIdToNetwork,
    selectTradingBuyIsLoading,
    selectTradingCoinInfoByCryptoId,
} from '@suite-common/trading';
import { WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { useDebounce } from '@trezor/react-utils';

import { selectValidTradingBuyQuotesNative } from '../../selectors/buySelectors';
import { tradingActions } from '../../tradingSlice';
import { BuyFormType } from '../../types/buy';
import { tradingBuyFormToTradingBuyFormProps } from '../../utils/general/quotesUtils';
import { getSelectedSymbolFromBuyForm } from '../../utils/general/tradeableAssetUtils';
import { useReloadTimer } from '../general/useReloadTimer';

type PromiseType = {
    abort: (message?: string) => void;
};

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
    quotesPromiseRef: ReturnType<typeof useRef<PromiseType | undefined>>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();
    const quotes = useSelector(selectValidTradingBuyQuotesNative);
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const shouldClearDebounceCallback = !isFormValid;
    const shouldAbortQuotesRequest = !isFormValid && isLoading;
    const shouldInvalidateQuotes = !isFormValid && quotes.length > 0;

    // make sure that no debounced quotes request is pending when form is invalid
    useEffect(() => {
        if (shouldClearDebounceCallback) {
            debounce(() => {});
        }
    }, [shouldClearDebounceCallback, debounce]);

    // make sure no quotes request is pending when form is invalid
    useEffect(() => {
        if (shouldAbortQuotesRequest && quotesPromiseRef.current?.abort) {
            quotesPromiseRef.current.abort('Invalidating quotes');
        }
    }, [shouldAbortQuotesRequest, quotesPromiseRef, debounce]);

    // make sure no stale quotes are present when form is invalid
    useEffect(() => {
        if (shouldInvalidateQuotes) {
            dispatch(tradingActions.clearQuotesAndQuotesRequest());
        }
    }, [shouldInvalidateQuotes, dispatch]);

    useEffect(
        // on form unmount
        () => () => {
            // make sure no quotes request is pending
            if (quotesPromiseRef.current?.abort) {
                quotesPromiseRef.current.abort('Component unmounted');
            }
            // clear whole buy state including quotes
            dispatch(tradingActions.clearBuyState());
            // debounce should be handled by useDebounce, no need to clear it here
        },
        [dispatch, quotesPromiseRef],
    );
};

const useBuyQuotesThunk = (
    form: BuyFormType,
    timer: ReturnType<typeof useReloadTimer>['timer'],
    shouldRefetchQuotes: boolean,
    quotesPromiseRef: ReturnType<typeof useRef<PromiseType | undefined>>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();

    const asset = form.watch('asset');
    const symbol = getSelectedSymbolFromBuyForm(form);
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, asset?.cryptoId),
    );

    useEffect(() => {
        if (shouldRefetchQuotes) {
            if (quotesPromiseRef.current?.abort) {
                quotesPromiseRef.current.abort('Request was replaced by another one.');
            }

            debounce(() => {
                const selectedAsset = form.getValues('asset');
                invariant(selectedAsset, 'Asset is not defined');
                const network = cryptoIdToNetwork(selectedAsset.cryptoId);
                invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

                const payload: HandleBuyRequestThunkProps = {
                    network,
                    formValues: tradingBuyFormToTradingBuyFormProps(form, coinInfo),
                    shouldSendInSats,
                    timer,
                };
                const requestPromise = dispatch(buyThunks.handleRequestThunk(payload));
                requestPromise.then(action => {
                    if (isFulfilled(action) && (action.payload as BuyTrade[]).length > 0) {
                        analytics.report({
                            type: EventType.TradingQuoteReceived,
                            payload: {
                                type: 'buy',
                            },
                        });
                    }
                });

                quotesPromiseRef.current = requestPromise;
            });
        }
    }, [
        form,
        shouldRefetchQuotes,
        timer,
        quotesPromiseRef,
        shouldSendInSats,
        coinInfo,
        debounce,
        dispatch,
    ]);
};

export const useBuyQuotes = (form: BuyFormType) => {
    const debounce = useDebounce();
    const promiseRef = useRef<PromiseType | undefined>(undefined);

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
