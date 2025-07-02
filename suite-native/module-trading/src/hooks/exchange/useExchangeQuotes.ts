import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import {
    HandleExchangeRequestThunkProps,
    cryptoIdToNetwork,
    exchangeThunks,
} from '@suite-common/trading';
import { WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { Timer, useDebounce } from '@trezor/react-utils';

import { exchangeActions } from '../../reducers';
import {
    selectExchangeQuotes,
    selectTradingExchangeIsLoading,
} from '../../selectors/exchangeSelectors';
import { ExchangeFormType } from '../../types/exchange';
import { tradingExchangeFormToTradingExchangeFormProps } from '../../utils/exchange/quotesUtils';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';
import { useReloadTimer } from '../general/useReloadTimer';

type ShouldFetchExchangeQuotesRef = {
    sendAsset: string | undefined;
    receiveAsset: string | undefined;
    sendCryptoAmount: string | undefined;
};

type PromiseType = {
    abort: (message?: string) => void;
};

const noop = () => {};

const useShouldFetchExchangeQuotes = (
    watch: ExchangeFormType['watch'],
): { isFetchAllowed: boolean; shouldFetchQuotes: boolean } => {
    const prevState = useRef<ShouldFetchExchangeQuotesRef>({
        sendAsset: undefined,
        receiveAsset: undefined,
        sendCryptoAmount: undefined,
    });

    const [sendAsset, receiveAsset, sendCryptoAmount] = watch([
        'sendAsset',
        'receiveAsset',
        'sendCryptoAmount',
    ]);

    const isFetchAllowed =
        !!sendAsset && !!receiveAsset && !!sendCryptoAmount && parseFloat(sendCryptoAmount) > 0;

    if (
        sendAsset?.cryptoId === prevState.current.sendAsset &&
        receiveAsset?.cryptoId === prevState.current.receiveAsset &&
        sendCryptoAmount === prevState.current.sendCryptoAmount
    ) {
        return {
            isFetchAllowed,
            shouldFetchQuotes: false,
        };
    }

    prevState.current = {
        sendAsset: sendAsset?.cryptoId,
        receiveAsset: receiveAsset?.cryptoId,
        sendCryptoAmount,
    };

    return {
        isFetchAllowed,
        shouldFetchQuotes: true,
    };
};

const useExchangeQuotesThunk = (
    getValues: ExchangeFormType['getValues'],
    timer: Timer,
    shouldRefetchQuotes: boolean,
    quotesPromiseRef: ReturnType<typeof useRef<PromiseType | undefined>>,
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

                const payload: HandleExchangeRequestThunkProps = {
                    formValues: tradingExchangeFormToTradingExchangeFormProps(getValues),
                    network,
                    timer,
                    shouldSendInSats,
                    composeRequestCallback: noop,
                };

                quotesPromiseRef.current = dispatch(exchangeThunks.handleRequestThunk(payload));
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

const useExchangeQuotesInvalidator = (
    isFormValid: boolean,
    quotesPromiseRef: ReturnType<typeof useRef<PromiseType | undefined>>,
    debounce: ReturnType<typeof useDebounce>,
) => {
    const dispatch = useDispatch();
    const quotes = useSelector(selectExchangeQuotes);
    const isLoading = useSelector(selectTradingExchangeIsLoading);

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
            dispatch(exchangeActions.clearQuotesAndQuotesRequest());
        }
    }, [shouldInvalidateQuotes, dispatch]);

    useEffect(
        // on form unmount
        () => () => {
            // make sure no quotes request is pending
            if (quotesPromiseRef.current?.abort) {
                quotesPromiseRef.current.abort('Component unmounted');
            }
            // clear whole exchange state including quotes
            dispatch(exchangeActions.clearState());
            // debounce should be handled by useDebounce, no need to clear it here
        },
        [dispatch, quotesPromiseRef],
    );
};

export const useExchangeQuotes = ({ watch, getValues }: ExchangeFormType) => {
    const debounce = useDebounce();
    const promiseRef = useRef<PromiseType | undefined>(undefined);

    const { isFetchAllowed, shouldFetchQuotes } = useShouldFetchExchangeQuotes(watch);

    const { timer, shouldReload } = useReloadTimer({ isEnabled: isFetchAllowed });

    useExchangeQuotesInvalidator(isFetchAllowed, promiseRef, debounce);
    useExchangeQuotesThunk(
        getValues,
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
