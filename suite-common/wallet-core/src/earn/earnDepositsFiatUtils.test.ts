import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type RatesByKey, type TokenAddress, toTokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import {
    type EarnStablecoinYieldDepositFiatInput,
    calculateEarnDepositsFiatData,
    getEarnDepositsFiatStatus,
} from './earnDepositsFiatUtils';

const USDC_CONTRACT_CHECKSUMMED = toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
const USDC_CONTRACT_LOWERCASE = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const ethSymbol = asNetworkSymbol('eth');

const createRates = (rates: Record<string, number>) =>
    Object.fromEntries(Object.entries(rates).map(([key, rate]) => [key, { rate }])) as RatesByKey;

const createYieldDeposit = (
    tokenContractAddress: TokenAddress,
): EarnStablecoinYieldDepositFiatInput => ({
    id: 'yield-1',
    networkSymbol: ethSymbol,
    tokenContractAddress,
    balance: '4',
});

describe(calculateEarnDepositsFiatData.name, () => {
    it('calculates staking and stablecoin yield deposits using available rates', () => {
        const result = calculateEarnDepositsFiatData({
            stakingDeposits: [{ id: 'staking-1', symbol: 'eth', balance: '2' }],
            stablecoinYieldDeposits: [createYieldDeposit(USDC_CONTRACT_LOWERCASE)],
            currentFiatRates: createRates({
                [getFiatRateKey(ethSymbol, 'usd')]: 3_000,
                [getFiatRateKey(ethSymbol, 'usd', USDC_CONTRACT_LOWERCASE)]: 1,
            }),
            baseCurrencyCode: 'usd',
        });

        expect(result.stakingDeposits[0]?.fiatAmount.toFixed()).toBe('6000');
        expect(result.stablecoinYieldDeposits[0]?.fiatAmount.toFixed()).toBe('4');
        expect(result.totalDepositedFiatAmount.toFixed()).toBe('6004');
        expect(result.missingRateTickers).toEqual([]);
    });

    it('finds a token rate stored under a differently cased contract address', () => {
        const result = calculateEarnDepositsFiatData({
            stakingDeposits: [],
            stablecoinYieldDeposits: [createYieldDeposit(USDC_CONTRACT_LOWERCASE)],
            currentFiatRates: createRates({
                [getFiatRateKey(ethSymbol, 'usd', USDC_CONTRACT_CHECKSUMMED)]: 1,
            }),
            baseCurrencyCode: 'usd',
        });

        expect(result.stablecoinYieldDeposits[0]?.fiatAmount.toFixed()).toBe('4');
        expect(result.missingStablecoinYieldRateTickers).toEqual([]);
    });

    it('normalizes and deduplicates tickers for deposits with missing rates', () => {
        const result = calculateEarnDepositsFiatData({
            stakingDeposits: [
                { id: 'staking-1', symbol: 'eth', balance: '2' },
                { id: 'staking-2', symbol: 'eth', balance: '1' },
            ],
            stablecoinYieldDeposits: [
                createYieldDeposit(USDC_CONTRACT_CHECKSUMMED),
                { ...createYieldDeposit(USDC_CONTRACT_LOWERCASE), id: 'yield-2' },
            ],
            currentFiatRates: createRates({}),
            baseCurrencyCode: 'usd',
        });

        expect(result.missingStakingRateTickers).toEqual([{ symbol: 'eth' }]);
        expect(result.missingStablecoinYieldRateTickers).toEqual([
            { symbol: 'eth', tokenAddress: USDC_CONTRACT_LOWERCASE },
        ]);
        expect(result.missingRateTickers).toEqual([
            { symbol: 'eth' },
            { symbol: 'eth', tokenAddress: USDC_CONTRACT_LOWERCASE },
        ]);
        expect(result.hasStakingFiatRate).toBe(false);
        expect(result.hasStablecoinYieldFiatRate).toBe(false);
    });

    it('keeps only loaded rates in the lower-bound total', () => {
        const result = calculateEarnDepositsFiatData({
            stakingDeposits: [{ id: 'staking-1', symbol: 'eth', balance: '2' }],
            stablecoinYieldDeposits: [createYieldDeposit(USDC_CONTRACT_LOWERCASE)],
            currentFiatRates: createRates({
                [getFiatRateKey(ethSymbol, 'usd', USDC_CONTRACT_LOWERCASE)]: 1,
            }),
            baseCurrencyCode: 'usd',
        });

        expect(result.totalDepositedFiatAmount.toFixed()).toBe('4');
        expect(result.hasStakingFiatRate).toBe(false);
        expect(result.hasStablecoinYieldFiatRate).toBe(true);
    });

    it('treats a rate of zero as missing', () => {
        const result = calculateEarnDepositsFiatData({
            stakingDeposits: [{ id: 'staking-1', symbol: 'eth', balance: '2' }],
            stablecoinYieldDeposits: [createYieldDeposit(USDC_CONTRACT_LOWERCASE)],
            currentFiatRates: createRates({
                [getFiatRateKey(ethSymbol, 'usd')]: 0,
                [getFiatRateKey(ethSymbol, 'usd', USDC_CONTRACT_LOWERCASE)]: 0,
            }),
            baseCurrencyCode: 'usd',
        });

        expect(result.hasStakingFiatRate).toBe(false);
        expect(result.hasStablecoinYieldFiatRate).toBe(false);
        expect(result.missingRateTickers).toEqual([
            { symbol: 'eth' },
            { symbol: 'eth', tokenAddress: USDC_CONTRACT_LOWERCASE },
        ]);
        expect(result.totalDepositedFiatAmount.toFixed()).toBe('0');
    });

    it('omits empty deposits from the calculated results', () => {
        const result = calculateEarnDepositsFiatData({
            stakingDeposits: [{ id: 'staking-1', symbol: 'eth', balance: null }],
            stablecoinYieldDeposits: [
                { ...createYieldDeposit(USDC_CONTRACT_LOWERCASE), balance: '0' },
            ],
            currentFiatRates: createRates({}),
            baseCurrencyCode: 'usd',
        });

        expect(result.stakingDeposits).toEqual([]);
        expect(result.stablecoinYieldDeposits).toEqual([]);
        expect(result.missingRateTickers).toEqual([]);
        expect(result.totalDepositedFiatAmount.toFixed()).toBe('0');
    });
});

describe(getEarnDepositsFiatStatus.name, () => {
    it('reports a complete total when no rates are missing', () => {
        const result = getEarnDepositsFiatStatus({
            missingStakingRateTickers: [],
            missingStablecoinYieldRateTickers: [],
            hasStakingFiatRate: true,
            hasStablecoinYieldFiatRate: true,
            isFiatRatesLoading: false,
        });

        expect(result).toEqual({
            isFiatTotalIncomplete: false,
            isFiatTotalUnavailable: false,
            isStakingFiatRateMissing: false,
            isStablecoinYieldFiatRateMissing: false,
        });
    });

    it('reports a lower-bound total when only one deposit type has a rate', () => {
        const result = getEarnDepositsFiatStatus({
            missingStakingRateTickers: [{ symbol: ethSymbol }],
            missingStablecoinYieldRateTickers: [],
            hasStakingFiatRate: false,
            hasStablecoinYieldFiatRate: true,
            isFiatRatesLoading: false,
        });

        expect(result).toEqual({
            isFiatTotalIncomplete: true,
            isFiatTotalUnavailable: false,
            isStakingFiatRateMissing: true,
            isStablecoinYieldFiatRateMissing: false,
        });
    });

    it('reports an unavailable total when no deposit type has a rate', () => {
        const result = getEarnDepositsFiatStatus({
            missingStakingRateTickers: [{ symbol: ethSymbol }],
            missingStablecoinYieldRateTickers: [
                { symbol: ethSymbol, tokenAddress: USDC_CONTRACT_LOWERCASE },
            ],
            hasStakingFiatRate: false,
            hasStablecoinYieldFiatRate: false,
            isFiatRatesLoading: false,
        });

        expect(result.isFiatTotalIncomplete).toBe(true);
        expect(result.isFiatTotalUnavailable).toBe(true);
    });

    it('does not report an incomplete total while missing rates are loading', () => {
        const result = getEarnDepositsFiatStatus({
            missingStakingRateTickers: [{ symbol: ethSymbol }],
            missingStablecoinYieldRateTickers: [],
            hasStakingFiatRate: false,
            hasStablecoinYieldFiatRate: false,
            isFiatRatesLoading: true,
        });

        expect(result.isFiatTotalIncomplete).toBe(false);
        expect(result.isFiatTotalUnavailable).toBe(false);
    });
});
