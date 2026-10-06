import { useForm } from 'react-hook-form';

import { act, renderHook } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { type TradingAssetSellOption, type TradingSellFormProps } from '@suite-common/trading';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { useTradingFiatCryptoAmount } from './useTradingFiatCryptoAmount';

const btcSymbol = toNetworkSymbolNonTestnet('btc');

const SEND_CRYPTO_SELECT: TradingAssetSellOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: btcSymbol,
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: btcSymbol,
    accountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: btcSymbol }),
};

const DEFAULTS: TradingSellFormProps = {
    outputs: [
        {
            type: 'payment',
            address: 'address',
            amount: '',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
            label: '',
        },
    ],
    countrySelect: {
        value: 'CZ' as const,
        codeAlpha3: 'CZE',
        flag: '🇨🇿',
        name: 'Czechia',
        label: '🇨🇿 Czechia',
        shortLabel: '🇨🇿 CZE',
    },
    sendCryptoSelect: SEND_CRYPTO_SELECT,
    amountInCrypto: true,
    paymentMethod: undefined,
    provider: undefined,
    feePerUnit: '',
    feeLimit: '',
    options: ['broadcast'],
    bitcoinLocktimeBlockHeight: '',
    bitcoinLocktimeDatetime: '',
    ethereumNonce: '',
    transactionData: '',
    destinationTag: '',
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    utxoSorting: 'newestFirst',
    selectedUtxos: [],
};

const renderFiatCryptoAmount = () =>
    renderHook(() => {
        const methods = useForm<TradingSellFormProps>({
            mode: 'onChange',
            defaultValues: DEFAULTS,
        });
        const amount = useTradingFiatCryptoAmount({ methods });

        return { amount, methods };
    });

describe('useTradingFiatCryptoAmount', () => {
    it('setFractionButton clears the max output id for a non-max fraction', () => {
        const { result } = renderFiatCryptoAmount();

        act(() => {
            result.current.methods.setValue('setMaxOutputId', 0);
            result.current.amount.setFractionButton(4);
        });

        expect(result.current.methods.getValues('setMaxOutputId')).toBeUndefined();
        expect(result.current.amount.fractionButton).toBe(4);
    });

    it('keeps the max output id for the max fraction', () => {
        const { result } = renderFiatCryptoAmount();

        act(() => {
            result.current.methods.setValue('setMaxOutputId', 0);
            result.current.amount.setFractionButton(1);
        });

        expect(result.current.methods.getValues('setMaxOutputId')).toBe(0);
        expect(result.current.amount.fractionButton).toBe(1);
    });

    it('onFiatCurrencyChange resets the fraction button and the max output id', () => {
        const { result } = renderFiatCryptoAmount();

        act(() => {
            result.current.methods.setValue('setMaxOutputId', 0);
            result.current.amount.setFractionButton(1);
        });

        act(() => {
            result.current.amount.onFiatCurrencyChange();
        });

        expect(result.current.amount.fractionButton).toBeUndefined();
        expect(result.current.methods.getValues('setMaxOutputId')).toBeUndefined();
    });
});
