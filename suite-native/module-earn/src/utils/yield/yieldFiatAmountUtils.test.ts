import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount, toTokenAddress } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import {
    getApproximateFiatAmount,
    getFiatFormValue,
    getYieldTokenContract,
    isAmountInputValueValid,
} from './yieldFiatAmountUtils';

const ethSymbol = asNetworkSymbol('eth');
const USDC_ADDRESS = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

const convertAtRate = (rate: number) => (amount: BigNumber) => amount.multipliedBy(rate);
const convertToBaseCurrencyAtRate = (rate: number) => (amount: BigNumber) =>
    asBaseCurrencyAmount(amount.multipliedBy(rate));

describe(getFiatFormValue.name, () => {
    it('returns an empty string for an empty crypto amount', () => {
        expect(
            getFiatFormValue({
                cryptoAmount: '',
                convertCryptoToFiat: convertAtRate(2000),
                decimals: 2,
            }),
        ).toBe('');
    });

    it('returns an empty string when no converter is available', () => {
        expect(
            getFiatFormValue({
                cryptoAmount: '1',
                convertCryptoToFiat: undefined,
                decimals: 2,
            }),
        ).toBe('');
    });

    it('returns an empty string when the converter returns null', () => {
        expect(
            getFiatFormValue({
                cryptoAmount: '1',
                convertCryptoToFiat: () => null,
                decimals: 2,
            }),
        ).toBe('');
    });

    it('returns an empty string when the converter returns NaN', () => {
        expect(
            getFiatFormValue({
                cryptoAmount: '1',
                convertCryptoToFiat: () => new BigNumber(NaN),
                decimals: 2,
            }),
        ).toBe('');
    });

    it('formats to the base-currency decimals, rounding down', () => {
        expect(
            getFiatFormValue({
                cryptoAmount: '1.000499',
                convertCryptoToFiat: convertAtRate(2000),
                decimals: 2,
            }),
        ).toBe('2000.99');
    });

    it('formats to an integer string when decimals is 0', () => {
        expect(
            getFiatFormValue({
                cryptoAmount: '2',
                convertCryptoToFiat: convertAtRate(3000),
                decimals: 0,
            }),
        ).toBe('6000');
    });
});

describe(getYieldTokenContract.name, () => {
    it('returns undefined for a null token', () => {
        expect(getYieldTokenContract(null)).toBeUndefined();
    });

    it('returns undefined when the contract address is null', () => {
        expect(
            getYieldTokenContract({
                networkSymbol: ethSymbol,
                symbol: 'USDC',
                decimals: 6,
                contractAddress: null,
            }),
        ).toBeUndefined();
    });

    it('returns undefined when the contract address is an empty string', () => {
        expect(
            getYieldTokenContract({
                networkSymbol: ethSymbol,
                symbol: 'USDC',
                decimals: 6,
                contractAddress: '',
            }),
        ).toBeUndefined();
    });

    it('returns the branded token address for a valid contract address', () => {
        expect(
            getYieldTokenContract({
                networkSymbol: ethSymbol,
                symbol: 'USDC',
                decimals: 6,
                contractAddress: USDC_ADDRESS,
            }),
        ).toBe(USDC_ADDRESS);
    });
});

describe(getApproximateFiatAmount.name, () => {
    it('returns null for an empty crypto amount', () => {
        expect(
            getApproximateFiatAmount({
                cryptoAmount: '',
                convertCryptoToFiat: convertToBaseCurrencyAtRate(2000),
            }),
        ).toBeNull();
    });

    it('returns null when no converter is available', () => {
        expect(
            getApproximateFiatAmount({
                cryptoAmount: '1',
                convertCryptoToFiat: undefined,
            }),
        ).toBeNull();
    });

    it('returns null when the converter returns null', () => {
        expect(
            getApproximateFiatAmount({
                cryptoAmount: '1',
                convertCryptoToFiat: () => null,
            }),
        ).toBeNull();
    });

    it('returns null for a zero amount', () => {
        expect(
            getApproximateFiatAmount({
                cryptoAmount: '0',
                convertCryptoToFiat: convertToBaseCurrencyAtRate(2000),
            }),
        ).toBeNull();
    });

    it('returns null for a non-numeric amount', () => {
        expect(
            getApproximateFiatAmount({
                cryptoAmount: 'not-a-number',
                convertCryptoToFiat: convertToBaseCurrencyAtRate(2000),
            }),
        ).toBeNull();
    });

    it('returns the converted value for a valid amount and rate', () => {
        expect(
            getApproximateFiatAmount({
                cryptoAmount: '2',
                convertCryptoToFiat: convertToBaseCurrencyAtRate(2000),
            })?.toString(),
        ).toBe('4000');
    });
});

describe(isAmountInputValueValid.name, () => {
    it.each([
        ['an empty value', '', 2, true],
        ['an integer', '999999999999', 2, true],
        ['a value within the decimal limit', '10.55', 2, true],
        ['a value at the decimal limit', '0.123456789012345678', 18, true],
        ['a value above the decimal limit', '10.555', 2, false],
        ['any decimals when zero are allowed', '10.5', 0, false],
    ])('%s → %s', (_description, value, decimals, expected) => {
        expect(isAmountInputValueValid({ value, decimals })).toBe(expected);
    });
});
