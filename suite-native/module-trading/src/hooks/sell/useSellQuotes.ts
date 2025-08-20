import { RefObject, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import {
    HandleSellRequestThunkProps,
    cryptoIdToNetwork,
    selectTradingSellIsLoading,
    sellThunks,
} from '@suite-common/trading';
import { WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { Timer, useDebounce } from '@trezor/react-utils';

import { sellActions } from '../../reducers';
import { selectSellQuotes } from '../../selectors/sellSelectors';
import { AbortablePromise } from '../../types/general';
import { SellFormType } from '../../types/sell';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';
import { tradingSellFormToTradingSellFormProps } from '../../utils/sell/quotesUtils';
import { useQuotesInvalidator } from '../general/useQuotesInvalidator';
import { useReloadTimer } from '../general/useReloadTimer';

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
    accountDescriptor: string | undefined;
};

const defaultState: ShouldFetchSellQuotesRef = {
    sendAsset: undefined,
    amount: undefined,
    amountInCrypto: true,
    fiatCurrency: undefined,
    country: undefined,
    accountDescriptor: undefined,
} as const;

const noop = () => {};

const useShouldFetchSellQuotes = ({ watch }: SellFormType): ShouldFetchSellQuotes => {
    const prevState = useRef<ShouldFetchSellQuotesRef>(defaultState);

    const [
        sendAsset,
        sendAccount,
        cryptoStringAmount,
        fiatStringAmount,
        amountInCrypto,
        fiatCurrency,
        country,
    ] = watch([
        'sendAsset',
        'sendAccount',
        'cryptoStringAmount',
        'fiatStringAmount',
        'amountInCrypto',
        'fiatCurrency',
        'country',
    ]);

    const amount = amountInCrypto ? cryptoStringAmount : fiatStringAmount;
    const isFetchAllowed = !!(sendAsset && fiatCurrency && amount && parseFloat(amount) > 0);

    if (
        sendAsset?.cryptoId === prevState.current.sendAsset &&
        amount === prevState.current.amount &&
        amountInCrypto === prevState.current.amountInCrypto &&
        fiatCurrency === prevState.current.fiatCurrency &&
        country?.value === prevState.current.country &&
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
    const quotes = useSelector(selectSellQuotes);
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
    timer: Timer,
    shouldRefetchQuotes: boolean,
    quotesPromiseRef: RefObject<AbortablePromise | undefined>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();
    const asset = getValues('sendAsset');
    const symbol = getSymbolFromTradeableAsset(asset);
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        if (shouldRefetchQuotes) {
            if (quotesPromiseRef.current?.abort) {
                quotesPromiseRef.current.abort('Request was replaced by another one.');
            }

            debounce(() => {
                const selectedAsset = getValues('sendAsset');
                invariant(selectedAsset, 'Asset is not defined');
                const network = cryptoIdToNetwork(selectedAsset.cryptoId);
                invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

                const payload: HandleSellRequestThunkProps = {
                    network,
                    shouldSendInSats,
                    timer,
                    formValues: tradingSellFormToTradingSellFormProps(getValues),
                    composeRequestCallback: noop,
                };
                quotesPromiseRef.current = dispatch(sellThunks.handleRequestThunk(payload));
            });
        }
    }, [
        dispatch,
        getValues,
        shouldRefetchQuotes,
        timer,
        quotesPromiseRef,
        debounce,
        shouldSendInSats,
    ]);
};

export const useSellQuotes = (form: SellFormType) => {
    const debounce = useDebounce();
    const promiseRef = useRef<AbortablePromise | undefined>(undefined);

    const { isFetchAllowed, shouldFetchQuotes } = useShouldFetchSellQuotes(form);
    const { timer, shouldReload } = useReloadTimer({ isEnabled: isFetchAllowed });

    useSellQuotesInvalidator(isFetchAllowed, promiseRef, debounce);
    useSellQuotesThunk(
        form.getValues,
        timer,
        isFetchAllowed && (shouldFetchQuotes || shouldReload),
        promiseRef,
        debounce,
    );

    return {
        timer,
        quotesPromiseRef: promiseRef.current,
    };
};
