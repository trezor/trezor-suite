import { useForm } from 'react-hook-form';

import { act, renderHook, waitFor } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import {
    type TradingAssetSellOption,
    type TradingFiatRatesReturn,
    type TradingSellFormProps,
} from '@suite-common/trading';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { type Timestamp } from '@suite-common/wallet-types';
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

const TRADING_FIAT_VALUES: TradingFiatRatesReturn = {
    fiatValue: null,
    fiatRate: {
        rate: 50000,
        lastTickerTimestamp: 0 as Timestamp,
        lastSuccessfulFetchTimestamp: 0 as Timestamp,
        isLoading: false,
        error: null,
        ticker: { symbol: btcSymbol },
    },
    accountBalance: '2',
    formattedBalance: '2',
    symbol: btcSymbol,
    networkDecimals: 8,
    tokenAddress: undefined,
    fiatRatesUpdater: jest.fn(() => Promise.resolve(null)),
};

const renderFiatCryptoAmount = (defaultValues: TradingSellFormProps = DEFAULTS) =>
    renderHook(() => {
        const methods = useForm<TradingSellFormProps>({
            mode: 'onChange',
            defaultValues,
        });
        const amount = useTradingFiatCryptoAmount({
            methods,
            tradingFiatValues: TRADING_FIAT_VALUES,
            networkDecimals: 8,
            shouldSendInSats: false,
        });

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

    it('recalculates the crypto amount from the typed fiat amount', async () => {
        const { result } = renderFiatCryptoAmount();

        act(() => {
            result.current.methods.setValue('outputs.0.fiat', '100');
        });

        await waitFor(
            () => expect(result.current.methods.getValues('outputs.0.amount')).toBe('0.00200000'),
            { timeout: 1500 },
        );
    });

    it('keeps a prefilled crypto amount on mount when the fiat is empty', async () => {
        const { result } = renderFiatCryptoAmount({
            ...DEFAULTS,
            outputs: [{ ...DEFAULTS.outputs[0]!, amount: '0.5', fiat: '' }],
        });

        await new Promise(resolve => {
            setTimeout(resolve, 700);
        });

        expect(result.current.methods.getValues('outputs.0.amount')).toBe('0.5');
        expect(result.current.methods.formState.errors.outputs).toBeUndefined();
    });

    it('does not recalculate crypto while a fraction button is active', async () => {
        const { result } = renderFiatCryptoAmount();

        act(() => {
            result.current.amount.setFractionButton(2);
            result.current.methods.setValue('outputs.0.fiat', '100');
        });

        await new Promise(resolve => {
            setTimeout(resolve, 700);
        });

        expect(result.current.methods.getValues('outputs.0.amount')).toBe('');
    });
});
