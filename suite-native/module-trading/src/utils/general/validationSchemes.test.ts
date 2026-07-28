import { useFormatters } from '@suite-common/formatters';
import { type yup } from '@suite-common/validators';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';
import type { TradingFormContext } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import {
    fiatAmountInputValidationSchema,
    sendCryptoAmountValidationSchema,
} from './validationSchemes';

let formatters: ReturnType<typeof useFormatters>;

beforeAll(() => {
    const { result } = renderHookWithBasicProvider(() => useFormatters());
    formatters = result.current;
});

const createContext = (overrides: Partial<TradingFormContext> = {}): TradingFormContext =>
    ({
        translate: getTranslation,
        FiatAmountFormatter: formatters.BaseCurrencyAmountFormatter,
        CryptoAmountFormatter: formatters.CryptoAmountFormatter,
        convertNumberToBaseUnit: (amount: number | undefined) => amount,
        sendSymbol: 'btc',
        currency: 'usd',
        balance: undefined,
        ...overrides,
    }) as unknown as TradingFormContext;

const validate = (schema: yup.AnySchema, value: number | undefined, context: TradingFormContext) =>
    schema.validate(value, { context });

const formatFiat = (amount: string, currency: string) =>
    formatters.BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(new BigNumber(amount)), {
        currency,
    }) ?? '';

const formatCrypto = (amount: string, symbol: string) =>
    formatters.CryptoAmountFormatter.format(amount, {
        symbol: symbol.toLowerCase() as NetworkSymbol,
        isBalance: true,
    });

describe('validationSchemes', () => {
    describe('fiatAmountInputValidationSchema', () => {
        it('passes when value is undefined', async () => {
            await expect(
                validate(fiatAmountInputValidationSchema, undefined, createContext()),
            ).resolves.toBeUndefined();
        });

        it('passes when no minFiat/maxFiat in context', async () => {
            await expect(
                validate(fiatAmountInputValidationSchema, 100, createContext()),
            ).resolves.toBe(100);
        });

        it('rejects negative values', async () => {
            await expect(
                validate(fiatAmountInputValidationSchema, -1, createContext()),
            ).rejects.toThrow('Invalid value');
        });

        describe('min', () => {
            const buildContext = () => createContext({ minFiat: '10', currency: 'usd' });

            it('rejects when value is below min', async () => {
                await expect(
                    validate(fiatAmountInputValidationSchema, 5, buildContext()),
                ).rejects.toThrow(
                    getTranslation('moduleTrading.validators.min', {
                        min: formatFiat('10', 'usd'),
                    }),
                );
            });

            it('accepts when value equals min', async () => {
                await expect(
                    validate(fiatAmountInputValidationSchema, 10, buildContext()),
                ).resolves.toBe(10);
            });

            it('accepts when value is above min', async () => {
                await expect(
                    validate(fiatAmountInputValidationSchema, 11, buildContext()),
                ).resolves.toBe(11);
            });
        });

        describe('max', () => {
            const buildContext = () => createContext({ maxFiat: '1000', currency: 'usd' });

            it('rejects when value is above max', async () => {
                await expect(
                    validate(fiatAmountInputValidationSchema, 1001, buildContext()),
                ).rejects.toThrow(
                    getTranslation('moduleTrading.validators.max', {
                        max: formatFiat('1000', 'usd'),
                    }),
                );
            });

            it('accepts when value equals max', async () => {
                await expect(
                    validate(fiatAmountInputValidationSchema, 1000, buildContext()),
                ).resolves.toBe(1000);
            });

            it('accepts when value is below max', async () => {
                await expect(
                    validate(fiatAmountInputValidationSchema, 999, buildContext()),
                ).resolves.toBe(999);
            });
        });
    });

    describe('sendCryptoAmountValidationSchema', () => {
        it('passes when value is undefined', async () => {
            await expect(
                validate(sendCryptoAmountValidationSchema, undefined, createContext()),
            ).resolves.toBeUndefined();
        });

        it('skips all checks when sendSymbol is undefined', async () => {
            const context = createContext({
                sendSymbol: undefined,
                minCrypto: '10',
                maxCrypto: '20',
                balance: '0',
            });

            await expect(validate(sendCryptoAmountValidationSchema, 1000, context)).resolves.toBe(
                1000,
            );
        });

        it('rejects negative values', async () => {
            await expect(
                validate(sendCryptoAmountValidationSchema, -1, createContext()),
            ).rejects.toThrow('Invalid value');
        });

        describe('min', () => {
            const buildContext = () => createContext({ sendSymbol: 'btc', minCrypto: '10' });

            it('rejects when value is below min', async () => {
                await expect(
                    validate(sendCryptoAmountValidationSchema, 5, buildContext()),
                ).rejects.toThrow(
                    getTranslation('moduleTrading.validators.min', {
                        min: formatCrypto('10', 'btc'),
                    }),
                );
            });

            it('accepts when value equals min', async () => {
                await expect(
                    validate(sendCryptoAmountValidationSchema, 10, buildContext()),
                ).resolves.toBe(10);
            });

            it('accepts when value is above min', async () => {
                await expect(
                    validate(sendCryptoAmountValidationSchema, 11, buildContext()),
                ).resolves.toBe(11);
            });
        });

        describe('max', () => {
            const buildContext = () => createContext({ sendSymbol: 'btc', maxCrypto: '100' });

            it('rejects when value is above max', async () => {
                await expect(
                    validate(sendCryptoAmountValidationSchema, 101, buildContext()),
                ).rejects.toThrow(
                    getTranslation('moduleTrading.validators.max', {
                        max: formatCrypto('100', 'btc'),
                    }),
                );
            });

            it('accepts when value equals max', async () => {
                await expect(
                    validate(sendCryptoAmountValidationSchema, 100, buildContext()),
                ).resolves.toBe(100);
            });

            it('accepts when value is below max', async () => {
                await expect(
                    validate(sendCryptoAmountValidationSchema, 99, buildContext()),
                ).resolves.toBe(99);
            });
        });

        describe('balance', () => {
            it('passes when balance is undefined', async () => {
                await expect(
                    validate(
                        sendCryptoAmountValidationSchema,
                        1000,
                        createContext({ sendSymbol: 'btc', balance: undefined }),
                    ),
                ).resolves.toBe(1000);
            });

            it('rejects with insufficient-balance when value exceeds balance', async () => {
                const context = createContext({ sendSymbol: 'btc', balance: '50' });

                await expect(
                    validate(sendCryptoAmountValidationSchema, 51, context),
                ).rejects.toThrow(getTranslation('moduleTrading.validators.insufficientBalance'));
            });

            it('rejects with network-reserve when value exceeds maxSpendableAmount but is within balance', async () => {
                const context = createContext({
                    sendSymbol: 'btc',
                    balance: '100',
                    maxSpendableAmount: '90',
                });

                await expect(
                    validate(sendCryptoAmountValidationSchema, 95, context),
                ).rejects.toThrow(
                    getTranslation('moduleTrading.validators.networkReserve', {
                        displaySymbol: 'BTC',
                    }),
                );
            });

            it('accepts when value is within maxSpendableAmount', async () => {
                const context = createContext({
                    sendSymbol: 'btc',
                    balance: '100',
                    maxSpendableAmount: '90',
                });

                await expect(validate(sendCryptoAmountValidationSchema, 90, context)).resolves.toBe(
                    90,
                );
            });

            it('passes when maxSpendableAmount is undefined and value is within balance', async () => {
                const context = createContext({
                    sendSymbol: 'btc',
                    balance: '100',
                    maxSpendableAmount: undefined,
                });

                await expect(validate(sendCryptoAmountValidationSchema, 50, context)).resolves.toBe(
                    50,
                );
            });
        });
    });
});
