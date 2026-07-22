import { type TranslationFunction } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type RatesByKey, asCryptoBaseCurrencyCode } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { getFiatInputRules } from '../tradingFormInputFiatCryptoRules';

const t = ((key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key) as TranslationFunction;

const btcUsdKey = asCryptoBaseCurrencyCode('btc-usd');

type Props = Parameters<typeof getFiatInputRules>[0];
type Validator = (value: string) => string | undefined;
type ValidateMap = Record<
    'min' | 'decimals' | 'balance' | 'networkReserve' | 'minFiat' | 'maxFiat',
    Validator
>;

const baseProps: Props = {
    isExchangeContext: false,
    isSellContext: false,
    translationString: t,
    fiatAmount: new BigNumber('100'),
    isNetworkReserveEnabled: false,
    networkReserveFiatAmount: null,
    feeFiatAmount: null,
    normalizedCryptoAmount: undefined,
    amountLimits: undefined,
    accountSymbol: 'btc' as NetworkSymbol,
    selectedCurrencyCode: 'usd' as BaseCurrencyCode,
    tokenAddress: undefined,
    rates: undefined,
};

const getValidators = (props: Props) =>
    (getFiatInputRules(props) as { validate: ValidateMap }).validate;

describe('getFiatInputRules — exchange context', () => {
    const exchangeProps = { ...baseProps, isExchangeContext: true };

    it('includes balance, networkReserve, minFiat but not maxFiat', () => {
        const validate = getValidators(exchangeProps);
        expect(validate).toHaveProperty('min');
        expect(validate).toHaveProperty('decimals');
        expect(validate).toHaveProperty('balance');
        expect(validate).toHaveProperty('networkReserve');
        expect(validate).toHaveProperty('minFiat');
        expect(validate).not.toHaveProperty('maxFiat');
    });

    describe('balance', () => {
        it('returns undefined when value is within fiatAmount', () => {
            const { balance } = getValidators(exchangeProps);
            expect(balance('50')).toBeUndefined();
            expect(balance('100')).toBeUndefined();
        });

        it('returns error when value exceeds fiatAmount', () => {
            const { balance } = getValidators(exchangeProps);
            expect(balance('100.01')).toBe('AMOUNT_IS_NOT_ENOUGH');
            expect(balance('200')).toBe('AMOUNT_IS_NOT_ENOUGH');
        });

        it('returns undefined when fiatAmount is null', () => {
            const { balance } = getValidators({ ...exchangeProps, fiatAmount: null });
            expect(balance('999')).toBeUndefined();
        });

        it('returns undefined when fiatAmount is undefined', () => {
            const { balance } = getValidators({ ...exchangeProps, fiatAmount: undefined });
            expect(balance('999')).toBeUndefined();
        });
    });

    describe('networkReserve', () => {
        it('returns undefined (noop) when isNetworkReserveEnabled is false', () => {
            const { networkReserve } = getValidators({
                ...exchangeProps,
                isNetworkReserveEnabled: false,
            });
            expect(networkReserve('50')).toBeUndefined();
        });

        it('returns undefined when value stays within balance minus reserve and fee', () => {
            const { networkReserve } = getValidators({
                ...exchangeProps,
                isNetworkReserveEnabled: true,
                fiatAmount: new BigNumber('100'),
                networkReserveFiatAmount: new BigNumber('10'),
                feeFiatAmount: new BigNumber('5'),
            });

            expect(networkReserve('85')).toBeUndefined();
        });

        it('returns error when value exceeds balance minus reserve and fee', () => {
            const { networkReserve } = getValidators({
                ...exchangeProps,
                isNetworkReserveEnabled: true,
                fiatAmount: new BigNumber('100'),
                networkReserveFiatAmount: new BigNumber('10'),
                feeFiatAmount: new BigNumber('5'),
            });

            expect(networkReserve('85.01')).toBe('AMOUNT_EXCEEDS_NETWORK_RESERVE');
        });
    });

    describe('minFiat', () => {
        it('returns undefined when normalizedCryptoAmount is undefined', () => {
            const { minFiat } = getValidators({
                ...exchangeProps,
                normalizedCryptoAmount: undefined,
                amountLimits: { currency: 'BTC', minCrypto: '0.01' },
            });
            expect(minFiat('')).toBeUndefined();
        });

        it('returns undefined when amountLimits.minCrypto is undefined', () => {
            const { minFiat } = getValidators({
                ...exchangeProps,
                normalizedCryptoAmount: '0.001',
                amountLimits: { currency: 'BTC' },
            });
            expect(minFiat('')).toBeUndefined();
        });

        it('returns undefined when normalizedCryptoAmount >= minCrypto', () => {
            const { minFiat } = getValidators({
                ...exchangeProps,
                normalizedCryptoAmount: '0.01',
                amountLimits: { currency: 'BTC', minCrypto: '0.01' },
            });
            expect(minFiat('')).toBeUndefined();
        });

        it('returns error with converted fiat minimum when rate is available', () => {
            const rates = {
                [btcUsdKey]: { rate: 50000 },
            } as unknown as RatesByKey;

            const { minFiat } = getValidators({
                ...exchangeProps,
                normalizedCryptoAmount: '0.0001',
                amountLimits: { currency: 'BTC', minCrypto: '0.01' },
                rates,
                selectedCurrencyCode: 'usd' as BaseCurrencyCode,
            });

            // 0.01 BTC * 50000 = 500 USD → "500.00"
            expect(minFiat('')).toBe(
                'TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT:{"minimum":"500.00","currency":"USD"}',
            );
        });

        it('falls back to minCrypto when rate is not available', () => {
            const { minFiat } = getValidators({
                ...exchangeProps,
                normalizedCryptoAmount: '0.0001',
                amountLimits: { currency: 'BTC', minCrypto: '0.01' },
                rates: undefined,
            });

            expect(minFiat('')).toBe(
                'TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT:{"minimum":"0.01","currency":"USD"}',
            );
        });
    });
});

describe('getFiatInputRules — non-exchange context', () => {
    it('includes minFiat and maxFiat but not balance', () => {
        const validate = getValidators(baseProps);
        expect(validate).toHaveProperty('min');
        expect(validate).toHaveProperty('decimals');
        expect(validate).toHaveProperty('minFiat');
        expect(validate).toHaveProperty('maxFiat');
        expect(validate).not.toHaveProperty('balance');
    });

    it('excludes networkReserve in buy context (isSellContext: false)', () => {
        const validate = getValidators({ ...baseProps, isSellContext: false });
        expect(validate).not.toHaveProperty('networkReserve');
    });

    it('includes networkReserve in sell context (isSellContext: true)', () => {
        const validate = getValidators({ ...baseProps, isSellContext: true });
        expect(validate).toHaveProperty('networkReserve');
    });

    describe('minFiat', () => {
        const propsWithLimits = {
            ...baseProps,
            amountLimits: { currency: 'USD', minFiat: '10', maxFiat: '1000' },
        };

        it('returns undefined when value is empty', () => {
            const { minFiat } = getValidators(propsWithLimits);
            expect(minFiat('')).toBeUndefined();
        });

        it('returns undefined when amountLimits.minFiat is not set', () => {
            const { minFiat } = getValidators({ ...baseProps, amountLimits: { currency: 'USD' } });
            expect(minFiat('1')).toBeUndefined();
        });

        it('returns undefined when value >= minFiat', () => {
            const { minFiat } = getValidators(propsWithLimits);
            expect(minFiat('10')).toBeUndefined();
            expect(minFiat('50')).toBeUndefined();
        });

        it('returns error when value < minFiat', () => {
            const { minFiat } = getValidators(propsWithLimits);
            expect(minFiat('9.99')).toBe(
                'TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT:{"minimum":"10.00","currency":"USD"}',
            );
        });
    });

    describe('maxFiat', () => {
        const propsWithLimits = {
            ...baseProps,
            amountLimits: { currency: 'USD', minFiat: '10', maxFiat: '1000' },
        };

        it('returns undefined when value is empty', () => {
            const { maxFiat } = getValidators(propsWithLimits);
            expect(maxFiat('')).toBeUndefined();
        });

        it('returns undefined when amountLimits.maxFiat is not set', () => {
            const { maxFiat } = getValidators({ ...baseProps, amountLimits: { currency: 'USD' } });
            expect(maxFiat('99999')).toBeUndefined();
        });

        it('returns undefined when value <= maxFiat', () => {
            const { maxFiat } = getValidators(propsWithLimits);
            expect(maxFiat('1000')).toBeUndefined();
            expect(maxFiat('500')).toBeUndefined();
        });

        it('returns error when value > maxFiat', () => {
            const { maxFiat } = getValidators(propsWithLimits);
            expect(maxFiat('1000.01')).toBe(
                'TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT:{"maximum":"1000.00","currency":"USD"}',
            );
        });
    });
});
