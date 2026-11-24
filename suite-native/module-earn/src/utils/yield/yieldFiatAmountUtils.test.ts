import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import {
    getApproximateFiatAmount,
    getFiatFormValue,
    getYieldTokenContract,
    isAmountInputValueValid,
} from './yieldFiatAmountUtils';

const ethSymbol = asNetworkSymbol('eth');
const USDC_ADDRESS = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

const buildToken = (contractAddress: string | null): YieldFlowDisplayToken => ({
    networkSymbol: ethSymbol,
    symbol: 'USDC',
    decimals: 6,
    contractAddress,
});

const convertAtRate = (rate: number) => (amount: BigNumber) => amount.multipliedBy(rate);
const convertToBaseCurrencyAtRate = (rate: number) => (amount: BigNumber) =>
    asBaseCurrencyAmount(amount.multipliedBy(rate));

describe(getFiatFormValue.name, () => {
    it.each([
        {
            name: 'an empty crypto amount',
            cryptoAmount: '',
            convertCryptoToFiat: convertAtRate(2000),
        },
        { name: 'a missing converter', cryptoAmount: '1', convertCryptoToFiat: undefined },
        { name: 'a converter returning null', cryptoAmount: '1', convertCryptoToFiat: () => null },
        {
            name: 'a converter returning NaN',
            cryptoAmount: '1',
            convertCryptoToFiat: () => new BigNumber(NaN),
        },
    ])('returns an empty string for $name', ({ cryptoAmount, convertCryptoToFiat }) => {
        expect(getFiatFormValue({ cryptoAmount, convertCryptoToFiat, decimals: 2 })).toBe('');
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
    it.each([
        { name: 'a null token', token: null, expected: undefined },
        { name: 'a null contract address', token: buildToken(null), expected: undefined },
        { name: 'an empty contract address', token: buildToken(''), expected: undefined },
        {
            name: 'a valid contract address',
            token: buildToken(USDC_ADDRESS),
            expected: USDC_ADDRESS,
        },
    ])('returns $expected for $name', ({ token, expected }) => {
        expect(getYieldTokenContract(token)).toBe(expected);
    });
});

describe(getApproximateFiatAmount.name, () => {
    it.each([
        {
            name: 'an empty crypto amount',
            cryptoAmount: '',
            convertCryptoToFiat: convertToBaseCurrencyAtRate(2000),
        },
        { name: 'a missing converter', cryptoAmount: '1', convertCryptoToFiat: undefined },
        { name: 'a converter returning null', cryptoAmount: '1', convertCryptoToFiat: () => null },
        {
            name: 'a zero amount',
            cryptoAmount: '0',
            convertCryptoToFiat: convertToBaseCurrencyAtRate(2000),
        },
        {
            name: 'a non-numeric amount',
            cryptoAmount: 'not-a-number',
            convertCryptoToFiat: convertToBaseCurrencyAtRate(2000),
        },
    ])('returns null for $name', ({ cryptoAmount, convertCryptoToFiat }) => {
        expect(getApproximateFiatAmount({ cryptoAmount, convertCryptoToFiat })).toBeNull();
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
