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

const useShouldFetchQuotes = (form: TradingBuyForm) => {
    const [asset, fiatCurrency, fiatValue, cryptoValue, amountInCrypto, country] = form.watch([
        'asset',
        'fiatCurrency',
        'fiatValue',
        'cryptoValue',
        'amountInCrypto',
        'country',
    ]);
    const [prevState, setPrevState] = useState<{
        cryptoId: string | undefined;
        fiatCurrency: string | undefined;
        amount: string | undefined;
        amountInCrypto: boolean | undefined;
        country: string | undefined;
    }>({
        cryptoId: undefined,
        fiatCurrency: undefined,
        amount: undefined,
        amountInCrypto: false,
        country: undefined,
    });

    const amount = amountInCrypto ? cryptoValue : fiatValue;

    if (!asset || !fiatCurrency || !amount) {
        return false;
    }

    if (
        asset?.cryptoId === prevState.cryptoId &&
        fiatCurrency === prevState.fiatCurrency &&
        amount === prevState.amount &&
        amountInCrypto === prevState.amountInCrypto &&
        country?.value === prevState.country
    ) {
        return false;
    }

    setPrevState({
        cryptoId: asset?.cryptoId,
        fiatCurrency,
        amount,
        amountInCrypto,
        country: country?.value,
    });

    return true;
};

export const useQuotes = (form: TradingBuyForm) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const { timer, shouldReload } = useReloadTimer();
    const promiseRef = useRef<PromiseType | undefined>(undefined);
    const shouldFetchQuotes = useShouldFetchQuotes(form);

    const asset = form.watch('asset');
    const symbol = getSelectedSymbolFromBuyForm(form);
    const shouldSendInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, asset?.cryptoId),
    );

    if (shouldFetchQuotes || shouldReload) {
        if (promiseRef.current?.abort) {
            promiseRef.current.abort('Request was replaced by another one.');
        }
        debounce(() => {
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
