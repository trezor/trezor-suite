import { useMissingRateTickersQuery } from '@suite-common/wallet-core';
import { type TokenAddress, toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import type { StakingEarnItem, YieldEarnItem } from '../types';
import { useEarnDepositsCardData } from './useEarnDepositsCardData';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useMissingRateTickersQuery: jest.fn(),
}));

const useMissingRateTickersQueryMock = jest.mocked(useMissingRateTickersQuery);
const refetchMissingRateTickersMock = jest.fn();

// The hook only reads these fields; constructing the full UseQueryResult is impractical,
// so the single cast below is the last resort the tests skill allows for such mocks.
const createMissingRateTickersQueryResult = (
    overrides: Partial<Pick<ReturnType<typeof useMissingRateTickersQuery>, 'isFetching'>> = {},
): ReturnType<typeof useMissingRateTickersQuery> =>
    ({
        isFetching: false,
        refetch: refetchMissingRateTickersMock,
        ...overrides,
    }) as unknown as ReturnType<typeof useMissingRateTickersQuery>;

// Checksummed casing as returned by blockbook for account tokens (EIP-55).
const USDC_CONTRACT_CHECKSUMMED = toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
// Lowercase casing as it arrives from the yield.xyz API (vault.token.address).
const USDC_CONTRACT_LOWERCASE = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const DAI_CONTRACT_LOWERCASE = toTokenAddress('0x0000000000000000000000000000000000000004');
const RECEIPT_TOKEN_CONTRACT = toTokenAddress('0x0000000000000000000000000000000000000003');

const ethAccountKey = mockAccountKey({ symbol: 'eth' });

const stakingItem: StakingEarnItem = {
    id: 'staking-eth-account-1',
    type: 'staking',
    symbol: 'eth',
    accountKey: ethAccountKey,
    balance: '2',
};

const createYieldItem = (underlyingContract: TokenAddress): YieldEarnItem => ({
    id: 'vault-1-account-1',
    type: 'stablecoin-yield',
    yieldId: 'vault-1',
    vaultName: 'Steakhouse USDC',
    tokenSymbol: toTokenSymbol('USDC'),
    networkSymbol: 'eth',
    underlyingTokenContract: underlyingContract,
    receiptTokenContract: RECEIPT_TOKEN_CONTRACT,
    contractAddress: RECEIPT_TOKEN_CONTRACT,
    tokenContractAddress: underlyingContract,
    accountKey: ethAccountKey,
    accountLabel: undefined,
    tokenBalance: '4',
    apy: 5.3,
});

const renderDepositsCardData = async ({
    items,
    stakingItems = [],
    currentRates,
}: {
    items: YieldEarnItem[];
    stakingItems?: StakingEarnItem[];
    currentRates: Record<string, { rate: number }>;
}) =>
    await renderHookWithStoreProvider(
        () =>
            useEarnDepositsCardData({
                stakingActiveItems: stakingItems,
                stablecoinYieldActiveItems: items,
            }),
        {
            preloadedState: {
                wallet: {
                    fiat: { current: currentRates, historic: {} },
                    settings: { localCurrency: 'usd' },
                },
            },
        },
    );

describe('useEarnDepositsCardData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useMissingRateTickersQueryMock.mockReturnValue(createMissingRateTickersQueryResult());
    });

    it('includes the yield position in the total when the token rate is available', async () => {
        const { result } = await renderDepositsCardData({
            items: [createYieldItem(USDC_CONTRACT_LOWERCASE)],
            currentRates: {
                [getFiatRateKey('eth', 'usd', USDC_CONTRACT_LOWERCASE)]: { rate: 1 },
            },
        });

        expect(result.current.totalDepositedFiatAmount.toFixed()).toBe('4');
        expect(result.current.stakingFiatAmount.toFixed()).toBe('0');
        expect(result.current.stablecoinYieldFiatAmount.toFixed()).toBe('4');
        expect(result.current.isFiatRatesLoading).toBe(false);
    });

    it('includes the yield position when the rate is stored under a differently cased contract address', async () => {
        const { result } = await renderDepositsCardData({
            items: [createYieldItem(USDC_CONTRACT_LOWERCASE)],
            currentRates: {
                [getFiatRateKey('eth', 'usd', USDC_CONTRACT_CHECKSUMMED)]: { rate: 1 },
            },
        });

        expect(result.current.totalDepositedFiatAmount.toFixed()).toBe('4');
        expect(useMissingRateTickersQueryMock).toHaveBeenLastCalledWith({
            missingRateTickers: [],
            baseCurrencyCode: 'usd',
        });
    });

    it('requests the missing token rate and reports the fiat loading state', async () => {
        useMissingRateTickersQueryMock.mockReturnValue(
            createMissingRateTickersQueryResult({ isFetching: true }),
        );

        const { result } = await renderDepositsCardData({
            items: [createYieldItem(USDC_CONTRACT_CHECKSUMMED)],
            currentRates: {
                [getFiatRateKey('eth', 'usd')]: { rate: 3000 },
            },
        });

        expect(useMissingRateTickersQueryMock).toHaveBeenLastCalledWith({
            missingRateTickers: [{ symbol: 'eth', tokenAddress: USDC_CONTRACT_LOWERCASE }],
            baseCurrencyCode: 'usd',
        });
        expect(result.current.isFiatRatesLoading).toBe(true);

        // The position stays listed with its token balance even while its rate is missing.
        expect(result.current.stablecoinYieldRow?.activeItems[0]?.balance).toBe('4');
        expect(result.current.totalDepositedFiatAmount.toFixed()).toBe('0');
    });

    it('reports an incomplete total and allows retry when the rate remains missing', async () => {
        const { result } = await renderDepositsCardData({
            items: [createYieldItem(USDC_CONTRACT_LOWERCASE)],
            currentRates: {},
        });

        expect(result.current.isFiatRatesLoading).toBe(false);
        expect(result.current.isFiatTotalIncomplete).toBe(true);
        expect(result.current.isFiatTotalUnavailable).toBe(true);

        result.current.retryMissingFiatRates();

        expect(refetchMissingRateTickersMock).toHaveBeenCalledTimes(1);
    });

    it('reports a lower-bound total when only some yield rates are available', async () => {
        const { result } = await renderDepositsCardData({
            items: [
                createYieldItem(USDC_CONTRACT_LOWERCASE),
                createYieldItem(DAI_CONTRACT_LOWERCASE),
            ],
            currentRates: {
                [getFiatRateKey('eth', 'usd', USDC_CONTRACT_LOWERCASE)]: { rate: 1 },
            },
        });

        expect(result.current.totalDepositedFiatAmount.toFixed()).toBe('4');
        expect(result.current.isFiatTotalIncomplete).toBe(true);
        expect(result.current.isFiatTotalUnavailable).toBe(false);
    });

    it('reports an unavailable total and requests a missing staking rate', async () => {
        const { result } = await renderDepositsCardData({
            items: [],
            stakingItems: [stakingItem],
            currentRates: {},
        });

        expect(useMissingRateTickersQueryMock).toHaveBeenLastCalledWith({
            missingRateTickers: [{ symbol: 'eth' }],
            baseCurrencyCode: 'usd',
        });
        expect(result.current.isFiatTotalIncomplete).toBe(true);
        expect(result.current.isFiatTotalUnavailable).toBe(true);
    });

    it('returns separate staking and DeFi totals for the earning balance breakdown', async () => {
        const { result } = await renderDepositsCardData({
            items: [createYieldItem(USDC_CONTRACT_LOWERCASE)],
            stakingItems: [stakingItem],
            currentRates: {
                [getFiatRateKey('eth', 'usd')]: { rate: 3_000 },
                [getFiatRateKey('eth', 'usd', USDC_CONTRACT_LOWERCASE)]: { rate: 1 },
            },
        });

        expect(result.current.stakingFiatAmount.toFixed()).toBe('6000');
        expect(result.current.stablecoinYieldFiatAmount.toFixed()).toBe('4');
        expect(result.current.totalDepositedFiatAmount.toFixed()).toBe('6004');
    });
});
