import { type DefaultValues, useForm } from 'react-hook-form';

import { act } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type TradingAssetOption,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
} from '@suite-common/trading';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { createDeferred } from '@trezor/utils';

import {
    type UseTradingExchangeAssetSelectParams,
    useTradingExchangeAssetSelect,
} from './useTradingExchangeAssetSelect';

const btcSymbol = toNetworkSymbolNonTestnet('btc');
const ethSymbol = toNetworkSymbolNonTestnet('eth');
const solSymbol = toNetworkSymbolNonTestnet('sol');

const BTC_ASSET: TradingAssetOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: btcSymbol,
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: btcSymbol,
};

const ETH_ASSET: TradingAssetOption = {
    id: 'ethereum' as CryptoId,
    isNativeToken: true,
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    contractAddress: null,
    symbol: ethSymbol,
    displaySymbol: 'ETH',
    networkName: 'Ethereum',
    networkSymbol: ethSymbol,
};

const SOL_ASSET: TradingAssetOption = {
    id: 'solana' as CryptoId,
    isNativeToken: true,
    name: 'Solana',
    coingeckoId: 'solana',
    contractAddress: null,
    symbol: solSymbol,
    displaySymbol: 'SOL',
    networkName: 'Solana',
    networkSymbol: solSymbol,
};

const asSellOption = (
    asset: TradingAssetOption,
    accountKey: AccountKey,
): TradingAssetSellOption => ({ ...asset, accountKey });

const BTC_ACCOUNT_KEY = 'btc-account-key' as AccountKey;
const ETH_ACCOUNT_KEY = 'eth-account-key' as AccountKey;

type BuildDefaultsParams = {
    sendCryptoSelect?: TradingAssetSellOption;
    receiveCryptoSelect?: TradingAssetOption | null;
    amount?: string;
};

const buildDefaults = ({
    sendCryptoSelect,
    receiveCryptoSelect = null,
    amount = '',
}: BuildDefaultsParams): DefaultValues<TradingExchangeFormProps> => ({
    outputs: [
        {
            type: 'payment',
            address: 'address',
            amount,
            fiat: amount === '' ? '' : '50000',
            currency: { value: 'usd', label: 'USD' },
            token: sendCryptoSelect?.contractAddress ?? null,
            label: '',
        },
    ],
    setMaxOutputId: amount === '' ? undefined : 0,
    sendCryptoSelect,
    receiveCryptoSelect,
    provider: 'changelly',
    amountInCrypto: true,
});

const renderAssetSelect = (
    defaultValues: DefaultValues<TradingExchangeFormProps>,
    changeImplementation: UseTradingExchangeAssetSelectParams['onCryptoCurrencyChange'] = () =>
        Promise.resolve(),
) => {
    const root = createTestCompositionRoot({});
    const onCryptoCurrencyChange = jest.fn(changeImplementation);
    const setAmountLimits = jest.fn();

    const { result } = renderHookWithStoreProvider(
        () => {
            const methods = useForm<TradingExchangeFormProps>({ mode: 'onChange', defaultValues });
            const handlers = useTradingExchangeAssetSelect({
                methods,
                onCryptoCurrencyChange,
                setAmountLimits,
            });

            return { methods, handlers };
        },
        { root },
    );

    return { result, onCryptoCurrencyChange, setAmountLimits };
};

describe('useTradingExchangeAssetSelect', () => {
    it('clears the receive asset when the picked send asset collides with it', async () => {
        const { result, onCryptoCurrencyChange } = renderAssetSelect(
            buildDefaults({
                sendCryptoSelect: asSellOption(BTC_ASSET, BTC_ACCOUNT_KEY),
                receiveCryptoSelect: ETH_ASSET,
            }),
        );
        const pickedAsset = asSellOption(ETH_ASSET, ETH_ACCOUNT_KEY);

        await act(async () => {
            await result.current.handlers.handleSellAssetSelect(pickedAsset);
        });

        expect(onCryptoCurrencyChange).toHaveBeenCalledWith(pickedAsset);
        expect(result.current.methods.getValues('receiveCryptoSelect')).toBeNull();
        expect(result.current.methods.getValues('provider')).toBeUndefined();
    });

    it('clears the colliding receive asset before the send asset change settles', async () => {
        const pendingChange = createDeferred<void>();
        const { result } = renderAssetSelect(
            buildDefaults({
                sendCryptoSelect: asSellOption(BTC_ASSET, BTC_ACCOUNT_KEY),
                receiveCryptoSelect: ETH_ASSET,
            }),
            () => pendingChange.promise,
        );

        act(() => {
            result.current.handlers.handleSellAssetSelect(asSellOption(ETH_ASSET, ETH_ACCOUNT_KEY));
        });

        expect(result.current.methods.getValues('receiveCryptoSelect')).toBeNull();
        expect(result.current.methods.getValues('provider')).toBeUndefined();

        await act(async () => {
            pendingChange.resolve();
            await pendingChange.promise;
        });
    });

    it('keeps a receive asset picked while the send asset change is pending', async () => {
        const pendingChange = createDeferred<void>();
        const { result } = renderAssetSelect(
            buildDefaults({
                sendCryptoSelect: asSellOption(BTC_ASSET, BTC_ACCOUNT_KEY),
                receiveCryptoSelect: ETH_ASSET,
            }),
            () => pendingChange.promise,
        );

        act(() => {
            result.current.handlers.handleSellAssetSelect(asSellOption(ETH_ASSET, ETH_ACCOUNT_KEY));
        });

        act(() => {
            result.current.handlers.handleReceiveAssetSelect(SOL_ASSET);
        });

        await act(async () => {
            pendingChange.resolve();
            await pendingChange.promise;
        });

        expect(result.current.methods.getValues('receiveCryptoSelect')).toEqual(SOL_ASSET);
    });

    it('keeps the receive asset when the picked send asset differs from it', async () => {
        const { result } = renderAssetSelect(
            buildDefaults({
                sendCryptoSelect: asSellOption(ETH_ASSET, ETH_ACCOUNT_KEY),
                receiveCryptoSelect: ETH_ASSET,
            }),
        );

        await act(async () => {
            await result.current.handlers.handleSellAssetSelect(
                asSellOption(BTC_ASSET, BTC_ACCOUNT_KEY),
            );
        });

        expect(result.current.methods.getValues('receiveCryptoSelect')).toEqual(ETH_ASSET);
    });

    it('clears the send asset but keeps the typed amount when the picked receive asset collides with it', () => {
        const { result, setAmountLimits } = renderAssetSelect(
            buildDefaults({
                sendCryptoSelect: asSellOption(BTC_ASSET, BTC_ACCOUNT_KEY),
                amount: '1',
            }),
        );

        act(() => {
            result.current.handlers.handleReceiveAssetSelect(BTC_ASSET);
        });

        expect(result.current.methods.getValues('sendCryptoSelect')).toBeUndefined();
        expect(result.current.methods.getValues('outputs.0.amount')).toBe('1');
        expect(result.current.methods.getValues('outputs.0.fiat')).toBe('');
        expect(result.current.methods.getValues('outputs.0.token')).toBeNull();
        expect(result.current.methods.getValues('setMaxOutputId')).toBeUndefined();
        expect(result.current.methods.getValues('receiveCryptoSelect')).toEqual(BTC_ASSET);
        expect(setAmountLimits).toHaveBeenCalledWith(undefined);
    });

    it('keeps the send asset when the picked receive asset differs from it', () => {
        const { result } = renderAssetSelect(
            buildDefaults({
                sendCryptoSelect: asSellOption(BTC_ASSET, BTC_ACCOUNT_KEY),
                amount: '1',
            }),
        );

        act(() => {
            result.current.handlers.handleReceiveAssetSelect(ETH_ASSET);
        });

        expect(result.current.methods.getValues('sendCryptoSelect')).toEqual(
            asSellOption(BTC_ASSET, BTC_ACCOUNT_KEY),
        );
        expect(result.current.methods.getValues('outputs.0.amount')).toBe('1');
        expect(result.current.methods.getValues('receiveCryptoSelect')).toEqual(ETH_ASSET);
    });
});
