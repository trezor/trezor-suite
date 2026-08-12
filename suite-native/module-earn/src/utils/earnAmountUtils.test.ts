import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount, toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { BigNumber } from '@trezor/utils';

import {
    formatEarnActiveItemBalance,
    formatEarnAmount,
    formatEarnTokenAmount,
} from './earnAmountUtils';
import { type EarnDepositsCardActiveItem } from '../types';

const ethSymbol = asNetworkSymbol('eth');
const accountKey = mockAccountKey();
const fiatAmount = asBaseCurrencyAmount(new BigNumber(0));

const stablecoinYieldItem = (balance: string, tokenSymbol: string): EarnDepositsCardActiveItem => ({
    id: 'stablecoin-yield-item',
    type: 'stablecoin-yield',
    title: 'Vault',
    networkSymbol: ethSymbol,
    tokenSymbol: toTokenSymbol(tokenSymbol),
    contractAddress: toTokenAddress('0x1'),
    tokenContractAddress: toTokenAddress('0x2'),
    accountKey,
    balance,
    fiatAmount,
    apy: null,
});

const stakingItem = (balance: string): EarnDepositsCardActiveItem => ({
    id: 'staking-item',
    type: 'staking',
    title: 'Staking',
    symbol: 'eth',
    accountKey,
    balance,
    fiatAmount,
});

describe(formatEarnAmount.name, () => {
    it('leaves out the symbol so it can be rendered as a separate element', () => {
        expect(formatEarnAmount({ amount: '10000.123', locale: 'en-US' })).toBe('10,000.123');
    });

    it('shows a dust amount in full precision instead of rounding it to zero', () => {
        expect(formatEarnAmount({ amount: '0.000000000000000001', locale: 'en-US' })).toBe(
            '0.000000000000000001',
        );
    });
});

describe(formatEarnTokenAmount.name, () => {
    it('truncates a long fractional part to 9 significant digits with an ellipsis', () => {
        expect(
            formatEarnTokenAmount({
                amount: '0.123456789012345678',
                locale: 'en-US',
                symbol: 'ETH',
            }),
        ).toBe('0.12345678… ETH');
    });

    it('shows a dust amount in full precision instead of rounding it to zero', () => {
        expect(
            formatEarnTokenAmount({
                amount: '0.000000000000000001',
                locale: 'en-US',
                symbol: 'ETH',
            }),
        ).toBe('0.000000000000000001 ETH');
    });

    it('keeps the truncating format for the smallest amount it can still display', () => {
        expect(
            formatEarnTokenAmount({
                amount: '0.00000001',
                locale: 'en-US',
                symbol: 'ETH',
            }),
        ).toBe('0.00000001 ETH');
    });

    it('respects the given locale separators', () => {
        expect(
            formatEarnTokenAmount({ amount: '10000.123', locale: 'cs-CZ', symbol: 'USDC' }),
        ).toBe('10 000,123 USDC');
    });
});

describe(formatEarnActiveItemBalance.name, () => {
    it('keeps a stablecoin-yield balance at full precision, not rounded to 2 decimals', () => {
        expect(
            formatEarnActiveItemBalance({
                item: stablecoinYieldItem('0.123456789012345678', 'WETH'),
                locale: 'en-US',
            }),
        ).toBe('0.12345678… WETH');
    });

    it('shows a dust-sized stablecoin-yield balance in full precision instead of zero', () => {
        expect(
            formatEarnActiveItemBalance({
                item: stablecoinYieldItem('0.000000000123456789', 'WETH'),
                locale: 'en-US',
            }),
        ).toBe('0.000000000123456789 WETH');
    });

    it('caps a staking balance to CRYPTO_BALANCE_DECIMALS and upper-cases the symbol', () => {
        expect(
            formatEarnActiveItemBalance({
                item: stakingItem('12.3456789'),
                locale: 'en-US',
            }),
        ).toBe('12.34568 ETH');
    });
});
