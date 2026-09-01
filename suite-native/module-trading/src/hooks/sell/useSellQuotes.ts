import { type RefObject, useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
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
import { useFormState, useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { sellActions } from '@suite-native/trading-state';
import { type AbortablePromise, type SellFormType } from '@suite-native/trading-types';
import { useDebounce } from '@trezor/react-utils';
import { noop } from '@trezor/utils';

import { tradingSellFormToTradingSellFormProps } from '../../utils/sell/quotesUtils';
import { useQuotesInvalidator } from '../general/useQuotesInvalidator';

type SellQuoteRequestState = {
    isFetchAllowed: boolean;
    sendAsset: string | undefined;
    amount: string | undefined;
    amountInCrypto: boolean | undefined;
    fiatCurrency: string | undefined;
    country: string | undefined;
    countrySubdivision: string | undefined;
    accountDescriptor: string | undefined;
};

const quoteDerivedCryptoErrorTypes = ['insufficient-balance', 'network-reserve'] as const;

const isQuoteDerivedCryptoError = (fieldName: string, type: unknown) =>
    fieldName === 'cryptoStringAmount' &&
    quoteDerivedCryptoErrorTypes.some(errorType => errorType === type);

const useSellQuoteRequestState = ({ control }: SellFormType): SellQuoteRequestState => {
    const [
        amountInCrypto,
        sendAsset,
        sendAccount,
        cryptoStringAmount,
        fiatStringAmount,
        fiatCurrency,
        country,
        countrySubdivision,
    ] = useWatch({
        control,
        name: [
            'amountInCrypto',
            'sendAsset',
            'sendAccount',
            'cryptoStringAmount',
            'fiatStringAmount',
            'fiatCurrency',
            'country',
            'countrySubdivision',
        ],
    });
    const { isValid, errors } = useFormState({ control });

    const errorEntries = Object.entries(errors);
    const isErrorCausedByQuote =
        !amountInCrypto &&
        errorEntries.every(([fieldName, { type }]) => isQuoteDerivedCryptoError(fieldName, type));
    const isFormValidForQuotes = isValid || isErrorCausedByQuote;

    const amount = amountInCrypto ? cryptoStringAmount : fiatStringAmount;
    const isFetchAllowed =
        isFormValidForQuotes && !!(sendAsset && fiatCurrency && amount && parseFloat(amount) > 0);

    return {
        isFetchAllowed,
        sendAsset: sendAsset?.cryptoId,
        amount,
        amountInCrypto,
        fiatCurrency,
        country: country?.value,
        countrySubdivision: countrySubdivision?.value,
        accountDescriptor: sendAccount?.descriptor,
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
    { getValues, control }: SellFormType,
    requestState: SellQuoteRequestState,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();
    const asset = useWatch({ control, name: 'sendAsset' });
    const symbol = getSymbolFromTradeableAsset(asset);
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const {
        isFetchAllowed,
        sendAsset,
        amount,
        amountInCrypto,
        fiatCurrency,
        country,
        countrySubdivision,
        accountDescriptor,
    } = requestState;

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
        sendAsset,
        amount,
        amountInCrypto,
        fiatCurrency,
        country,
        countrySubdivision,
        accountDescriptor,
    ]);

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

    const requestState = useSellQuoteRequestState(form);

    useSellQuotesInvalidator(requestState.isFetchAllowed, promiseRef, debounce);
    useSellQuotesThunk(form, requestState, promiseRef, debounce);
};
