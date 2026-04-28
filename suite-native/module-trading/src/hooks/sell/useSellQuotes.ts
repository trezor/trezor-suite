import { type RefObject, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import {
    type HandleSellRequestThunkProps,
    cryptoIdToNetwork,
    selectTradingSellIsLoading,
    selectValidTradingSellQuotes,
    sellThunks,
    useTradingRefetchScheduler,
} from '@suite-common/trading';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { useFormState } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { sellActions } from '@suite-native/trading-state';
import { type AbortablePromise, type SellFormType } from '@suite-native/trading-types';
import { useDebounce } from '@trezor/react-utils';

import { tradingSellFormToTradingSellFormProps } from '../../utils/sell/quotesUtils';
import { useQuotesInvalidator } from '../general/useQuotesInvalidator';

type ShouldFetchSellQuotes = {
    isFetchAllowed: boolean;
    shouldFetchQuotes: boolean;
};

type ShouldFetchSellQuotesRef = {
    sendAsset: string | undefined;
    amount: string | undefined;
    amountInCrypto: boolean | undefined;
    fiatCurrency: string | undefined;
    country: string | undefined;
    countrySubdivision: string | undefined;
    accountDescriptor: string | undefined;
};

const defaultState: ShouldFetchSellQuotesRef = {
    sendAsset: undefined,
    amount: undefined,
    amountInCrypto: true,
    fiatCurrency: undefined,
    country: undefined,
    countrySubdivision: undefined,
    accountDescriptor: undefined,
} as const;

const noop = () => {};

const useShouldFetchSellQuotes = ({ watch, control }: SellFormType): ShouldFetchSellQuotes => {
    const prevState = useRef<ShouldFetchSellQuotesRef>(defaultState);

    const amountInCrypto = watch('amountInCrypto');

    const { isValid, errors } = useFormState({ control });

    if (!isValid) {
        const errorCausedByQuote =
            !amountInCrypto &&
            Object.values(errors).every(({ type }) => type === 'insufficient-balance');

        if (!errorCausedByQuote) {
            prevState.current = defaultState;

            return {
                isFetchAllowed: false,
                shouldFetchQuotes: false,
            };
        }
    }

    const [
        sendAsset,
        sendAccount,
        cryptoStringAmount,
        fiatStringAmount,
        fiatCurrency,
        country,
        countrySubdivision,
    ] = watch([
        'sendAsset',
        'sendAccount',
        'cryptoStringAmount',
        'fiatStringAmount',
        'fiatCurrency',
        'country',
        'countrySubdivision',
    ]);

    const amount = amountInCrypto ? cryptoStringAmount : fiatStringAmount;
    const isFetchAllowed = !!(sendAsset && fiatCurrency && amount && parseFloat(amount) > 0);

    if (
        sendAsset?.cryptoId === prevState.current.sendAsset &&
        amount === prevState.current.amount &&
        amountInCrypto === prevState.current.amountInCrypto &&
        fiatCurrency === prevState.current.fiatCurrency &&
        country?.value === prevState.current.country &&
        countrySubdivision?.value === prevState.current.countrySubdivision &&
        sendAccount?.descriptor === prevState.current.accountDescriptor
    ) {
        return {
            isFetchAllowed,
            shouldFetchQuotes: false,
        };
    }

    prevState.current = {
        sendAsset: sendAsset?.cryptoId,
        amount,
        amountInCrypto,
        fiatCurrency,
        country: country?.value,
        countrySubdivision: countrySubdivision?.value,
        accountDescriptor: sendAccount?.descriptor,
    };

    return {
        isFetchAllowed,
        shouldFetchQuotes: true,
    };
};

const useSellQuotesInvalidator = (
    isFormValid: boolean,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const quotes = useSelector(selectValidTradingSellQuotes);
    const isLoading = useSelector(selectTradingSellIsLoading);

    useQuotesInvalidator({
        isFormValid,
        isLoading,
        anyQuotesLoaded: quotes.length > 0,
        quotesPromiseRef,
        debounce,
        getClearRequestAction: sellActions.clearQuotesAndQuotesRequest,
        getClearStateAction: sellActions.clearState,
    });
};

const useSellQuotesThunk = (
    getValues: SellFormType['getValues'],
    isFetchAllowed: boolean,
    shouldFetchQuotes: boolean,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();
    const asset = getValues('sendAsset');
    const symbol = getSymbolFromTradeableAsset(asset);
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    const fetchQuotes = useCallback(() => {
        const selectedAsset = getValues('sendAsset');
        invariant(selectedAsset, 'Asset is not defined');
        const network = cryptoIdToNetwork(selectedAsset.cryptoId);
        invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

        const payload: HandleSellRequestThunkProps = {
            network,
            shouldSendInSats,
            formValues: tradingSellFormToTradingSellFormProps(getValues),
            composeRequestCallback: noop,
        };
        quotesPromiseRef.current = dispatch(sellThunks.handleRequestThunk(payload));
    }, [getValues, shouldSendInSats, quotesPromiseRef, dispatch]);

    useEffect(() => {
        if (!isFetchAllowed || !shouldFetchQuotes) return;

        if (quotesPromiseRef.current?.abort) {
            quotesPromiseRef.current.abort('Request was replaced by another one.');
        }

        debounce(fetchQuotes);
    }, [isFetchAllowed, shouldFetchQuotes, quotesPromiseRef, debounce, fetchQuotes]);

    useTradingRefetchScheduler({
        onRefetch: () => {
            if (!isFetchAllowed) return;
            debounce(fetchQuotes);
        },
    });
};

export const useSellQuotes = (form: SellFormType) => {
    const debounce = useDebounce();
    const promiseRef = useRef<AbortablePromise | undefined>(undefined);

    const { isFetchAllowed, shouldFetchQuotes } = useShouldFetchSellQuotes(form);

    useSellQuotesInvalidator(isFetchAllowed, promiseRef, debounce);
    useSellQuotesThunk(form.getValues, isFetchAllowed, shouldFetchQuotes, promiseRef, debounce);
};
