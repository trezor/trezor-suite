import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import {
    HandleRequestThunkProps,
    TradingRootState,
    buyThunks,
    selectTradingCoinInfoByCryptoId,
    tradingBuyActions,
} from '@suite-common/trading';
import { getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { SettingsSliceRootState, selectIsAmountInSats } from '@suite-native/settings';
import { useDebounce } from '@trezor/react-utils';

import { TradingBuyForm } from '../types';
import { useReloadTimer } from './useReloadTimer';
import { tradingBuyFormToTradingBuyFormProps } from '../utils/quotesUtils';
import { getSelectedSymbolFromBuyForm } from '../utils/tradeableAssetUtils';

type PromiseType = {
    abort: (message?: string) => void;
};

type ShouldFetchQuotesState = {
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
    const [prevState, setPrevState] = useState<ShouldFetchQuotesState>({
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
        asset?.cryptoId === prevState.cryptoId &&
        fiatCurrency === prevState.fiatCurrency &&
        amount === prevState.amount &&
        amountInCrypto === prevState.amountInCrypto &&
        country?.value === prevState.country
    ) {
        return {
            isFetchAllowed,
            shouldFetchQuotes: false,
        };
    }

    setPrevState({
        cryptoId: asset?.cryptoId,
        fiatCurrency,
        amount,
        amountInCrypto,
        country: country?.value,
    });

    return {
        isFetchAllowed,
        shouldFetchQuotes: true,
    };
};

export const useQuotes = (form: TradingBuyForm) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const promiseRef = useRef<PromiseType | undefined>(undefined);
    const { isFetchAllowed, shouldFetchQuotes } = useShouldFetchQuotes(form);
    const { timer, shouldReload } = useReloadTimer(isFetchAllowed);
    const asset = form.watch('asset');
    const symbol = getSelectedSymbolFromBuyForm(form);
    const shouldSendInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, asset?.cryptoId),
    );

    if (isFetchAllowed && (shouldFetchQuotes || shouldReload)) {
        if (promiseRef.current?.abort) {
            promiseRef.current.abort('Request was replaced by another one.');
        }

        debounce(() => {
            invariant(asset, 'Asset is not defined');
            const network = getNetworkByCoingeckoId(asset.networkId);
            invariant(network, `Network not found for ${asset.networkId}`);

            const payload: HandleRequestThunkProps = {
                network,
                formValues: tradingBuyFormToTradingBuyFormProps(form, coinInfo),
                shouldSendInSats,
                timer,
            };
            promiseRef.current = dispatch(buyThunks.handleRequestThunk(payload));
        });
    }

    useEffect(
        () => () => {
            if (promiseRef.current?.abort) {
                promiseRef.current.abort('Component unmounted');
            }
            dispatch(tradingBuyActions.saveQuotes([]));
        },
        [dispatch],
    );

    return {
        timer,
        quotesRequest: promiseRef.current,
    };
};
