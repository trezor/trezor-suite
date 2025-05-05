import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import {
    HandleRequestThunkProps,
    TradingRootState,
    buyThunks,
    selectTradingBuyIsLoading,
    selectTradingBuyQuotes,
    selectTradingCoinInfoByCryptoId,
} from '@suite-common/trading';
import { getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { SettingsSliceRootState, selectIsAmountInSats } from '@suite-native/settings';
import { useDebounce } from '@trezor/react-utils';

import { clearBuyState, clearQuotesAndQuotesRequest } from '../tradingSlice';
import { TradingBuyForm } from '../types';
import { useReloadTimer } from './useReloadTimer';
import { tradingBuyFormToTradingBuyFormProps } from '../utils/quotesUtils';
import { getSelectedSymbolFromBuyForm } from '../utils/tradeableAssetUtils';

type PromiseType = {
    abort: (message?: string) => void;
};

type ShouldFetchQuotesRef = {
    cryptoId: string | undefined;
    fiatCurrency: string | undefined;
    amount: string | undefined;
    amountInCrypto: boolean | undefined;
    country: string | undefined;
};

type ShouldFetchQuotes = {
    isFetchAllowed: boolean;
    shouldFetchQuotes: boolean;
};

const useShouldFetchQuotes = (form: TradingBuyForm): ShouldFetchQuotes => {
    const prevState = useRef<ShouldFetchQuotesRef>({
        cryptoId: undefined,
        fiatCurrency: undefined,
        amount: undefined,
        amountInCrypto: false,
        country: undefined,
    });
    const [asset, fiatCurrency, fiatValue, cryptoValue, amountInCrypto, country] = form.watch([
        'asset',
        'fiatCurrency',
        'fiatValue',
        'cryptoValue',
        'amountInCrypto',
        'country',
    ]);

    const amount = amountInCrypto ? cryptoValue : fiatValue;
    const isFetchAllowed = !!(asset && fiatCurrency && amount);

    if (
        asset?.cryptoId === prevState.current.cryptoId &&
        fiatCurrency === prevState.current.fiatCurrency &&
        amount === prevState.current.amount &&
        amountInCrypto === prevState.current.amountInCrypto &&
        country?.value === prevState.current.country
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
    };

    return {
        isFetchAllowed,
        shouldFetchQuotes: true,
    };
};

const useQuotesInvalidator = (
    isFormValid: boolean,
    quotesPromiseRef: ReturnType<typeof useRef<PromiseType | undefined>>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();
    const quotes = useSelector(selectTradingBuyQuotes);
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
            dispatch(clearQuotesAndQuotesRequest());
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
            dispatch(clearBuyState());
            // debounce should be handled by useDebounce, no need to clear it here
        },
        [dispatch, quotesPromiseRef],
    );
};

const useQuotesThunk = (
    form: TradingBuyForm,
    timer: ReturnType<typeof useReloadTimer>['timer'],
    shouldRefetchQuotes: boolean,
    quotesPromiseRef: ReturnType<typeof useRef<PromiseType | undefined>>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();

    const asset = form.watch('asset');
    const symbol = getSelectedSymbolFromBuyForm(form);
    const shouldSendInSats = useSelector((state: SettingsSliceRootState) =>
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
                const network = getNetworkByCoingeckoId(selectedAsset.networkId);
                invariant(network, `Network not found for ${selectedAsset.networkId}`);

                const payload: HandleRequestThunkProps = {
                    network,
                    formValues: tradingBuyFormToTradingBuyFormProps(form, coinInfo),
                    shouldSendInSats,
                    timer,
                };
                quotesPromiseRef.current = dispatch(buyThunks.handleRequestThunk(payload));
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

export const useQuotes = (form: TradingBuyForm) => {
    const debounce = useDebounce();
    const promiseRef = useRef<PromiseType | undefined>(undefined);

    const { isFetchAllowed, shouldFetchQuotes } = useShouldFetchQuotes(form);
    const { timer, shouldReload } = useReloadTimer({ isEnabled: isFetchAllowed });

    useQuotesInvalidator(isFetchAllowed, promiseRef, debounce);
    useQuotesThunk(
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
