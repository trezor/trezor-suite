import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { featureFlagsInitialState } from '@suite-native/feature-flags';
import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils-store';
import { adaAsset, btcAsset, createMockRate, ethAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType, type TradeableAsset } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';
import { mergeDeepObject } from '@trezor/utils';

import { useExchangeForm } from './useExchangeForm';
import { useExchangeSendBaseCurrencyAmount } from './useExchangeSendBaseCurrencyAmount';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';
import { setExchangeSendCryptoAmount } from '../../utils/exchange/exchangeSendAmountUtils';

jest.mock('../general/useAmountInputDecimals', () => ({
    useAmountInputDecimals: () => 8,
}));

describe('useExchangeSendBaseCurrencyAmount', () => {
    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: { ...featureFlagsInitialState },
    };
    const satsOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
    };
    const btcBaseCurrencyInSatsOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            settings: { localCurrency: 'btc', bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI },
            fiat: {
                current: {
                    [getFiatRateKey(asNetworkSymbol('eth'), 'btc')]: createMockRate(
                        0.05,
                        asNetworkSymbol('eth'),
                    ),
                },
            },
        },
    };

    const renderSendAmount = async (
        asset: TradeableAsset,
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) => {
        const overrides = mergeDeepObject(baseOverrides, extraOverrides);
        const { result: formResult } = await renderHookWithTradingProvider(
            () => useExchangeForm(),
            { tradeType: 'exchange', overrides },
        );
        const form: ExchangeFormType = formResult.current;

        await act(() => {
            form.setValue('sendAsset', asset);
        });

        const { result } = await renderHookWithTradingProvider(
            () => useExchangeSendBaseCurrencyAmount(),
            {
                tradeType: 'exchange',
                overrides,
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            },
        );

        return { form, result };
    };

    it('should set crypto amount and derive the base currency amount from it', async () => {
        const { form, result } = await renderSendAmount(ethAsset);

        await act(() => {
            setExchangeSendCryptoAmount(form.setValue, '1.5');
        });

        expect(form.getValues('sendCryptoAmount')).toBe('1.5');
        expect(form.getValues('sendBaseCurrencyAmount')).toBeUndefined();
        expect(result.current.baseCurrencyAmount).toBe('1500');
    });

    it('should set base currency amount and convert it to crypto amount', async () => {
        const { form, result } = await renderSendAmount(ethAsset);

        await act(() => {
            result.current.setBaseCurrencyAmount('100');
        });

        expect(form.getValues('sendCryptoAmount')).toBe('0.1');
        expect(result.current.baseCurrencyAmount).toBe('100');
    });

    it('should keep the typed base currency amount as typed', async () => {
        const { result } = await renderSendAmount(ethAsset);

        await act(() => {
            result.current.setBaseCurrencyAmount('100.');
        });

        expect(result.current.baseCurrencyAmount).toBe('100.');
    });

    it('should derive the base currency amount once the crypto amount is changed directly', async () => {
        const { form, result } = await renderSendAmount(ethAsset);

        await act(() => {
            result.current.setBaseCurrencyAmount('100');
        });
        await act(() => {
            form.setValue('sendCryptoAmount', '0.2');
        });

        expect(result.current.baseCurrencyAmount).toBe('200');
    });

    it('should convert base currency amount to sats when amounts are displayed in sats', async () => {
        const { form, result } = await renderSendAmount(btcAsset, satsOverrides);

        await act(() => {
            result.current.setBaseCurrencyAmount('1');
        });

        expect(form.getValues('sendCryptoAmount')).toBe('100000000000');
        expect(result.current.baseCurrencyAmount).toBe('1');
    });

    it('should convert base currency amount from sats when base currency is BTC displayed in sats', async () => {
        const { form, result } = await renderSendAmount(ethAsset, btcBaseCurrencyInSatsOverrides);

        await act(() => {
            result.current.setBaseCurrencyAmount('5000000');
        });

        expect(form.getValues('sendCryptoAmount')).toBe('1');
        expect(result.current.baseCurrencyAmount).toBe('5000000');
    });

    it('should derive base currency amount in sats when base currency is BTC displayed in sats', async () => {
        const { form, result } = await renderSendAmount(ethAsset, btcBaseCurrencyInSatsOverrides);

        await act(() => {
            setExchangeSendCryptoAmount(form.setValue, '0.5');
        });

        expect(result.current.baseCurrencyAmount).toBe('2500000');
    });

    it('should not change crypto amount when there is no rate for the asset', async () => {
        const { form, result } = await renderSendAmount(adaAsset);

        await act(() => {
            setExchangeSendCryptoAmount(form.setValue, '5');
        });
        await act(() => {
            result.current.setBaseCurrencyAmount('100');
        });

        expect(form.getValues('sendCryptoAmount')).toBe('5');
        expect(result.current).toEqual(
            expect.objectContaining({
                baseCurrencyAmount: undefined,
                isConversionAvailable: false,
            }),
        );
    });

    it('should clear both amounts', async () => {
        const { form, result } = await renderSendAmount(ethAsset);

        await act(() => {
            result.current.setBaseCurrencyAmount('100');
        });
        await act(() => {
            setExchangeSendCryptoAmount(form.setValue, undefined);
        });

        expect(form.getValues('sendCryptoAmount')).toBeUndefined();
        expect(form.getValues('sendBaseCurrencyAmount')).toBeUndefined();
        expect(result.current.baseCurrencyAmount).toBeUndefined();
    });

    it('should keep the typed base currency amount until the crypto amount is set directly', async () => {
        const { form, result } = await renderSendAmount(ethAsset);

        await act(() => {
            result.current.setBaseCurrencyAmount('100');
        });

        expect(form.getValues('sendBaseCurrencyAmount')).toBe('100');

        await act(() => {
            setExchangeSendCryptoAmount(form.setValue, '0.3');
        });

        expect(form.getValues('sendBaseCurrencyAmount')).toBeUndefined();
        expect(result.current.baseCurrencyAmount).toBe('300');
    });
});
