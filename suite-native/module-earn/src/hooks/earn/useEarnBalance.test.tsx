import { asNetworkSymbol } from '@suite-common/wallet-config';
import { useMissingRateTickersQuery } from '@suite-common/wallet-core';
import { type TokenAddress, toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useEarnBalance } from './useEarnBalance';
import { type StakingListItem, type YieldListItem } from '../../types';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    useMissingRateTickersQuery: jest.fn(),
}));

const useMissingRateTickersQueryMock = jest.mocked(useMissingRateTickersQuery);
const refetchMissingRateTickersMock = jest.fn();

const createMissingRateTickersQueryResult = (
    overrides: Partial<Pick<ReturnType<typeof useMissingRateTickersQuery>, 'isFetching'>> = {},
): ReturnType<typeof useMissingRateTickersQuery> =>
    ({
        isFetching: false,
        refetch: refetchMissingRateTickersMock,
        ...overrides,
    }) as unknown as ReturnType<typeof useMissingRateTickersQuery>;

const USDC_CONTRACT_CHECKSUMMED = toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
const USDC_CONTRACT_LOWERCASE = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const DAI_CONTRACT_LOWERCASE = toTokenAddress('0x0000000000000000000000000000000000000004');
const RECEIPT_TOKEN_CONTRACT = toTokenAddress('0x0000000000000000000000000000000000000003');

const ethSymbol = asNetworkSymbol('eth');
const ethAccountKey = mockAccountKey({ symbol: ethSymbol });

const stakingPosition: StakingListItem = {
    symbol: ethSymbol,
    accountKey: ethAccountKey,
    balance: '2',
};

const createYieldPosition = (
    underlyingContract: TokenAddress,
    overrides: Partial<YieldListItem> = {},
): YieldListItem => ({
    id: 'vault-1',
    yieldId: 'vault-1',
    vaultName: 'Steakhouse USDC',
    tokenSymbol: toTokenSymbol('USDC'),
    networkSymbol: ethSymbol,
    underlyingTokenContract: underlyingContract,
    receiptTokenContract: RECEIPT_TOKEN_CONTRACT,
    contractAddress: RECEIPT_TOKEN_CONTRACT,
    tokenContractAddress: underlyingContract,
    apy: 5.3,
    accountKey: ethAccountKey,
    tokenBalance: '4',
    ...overrides,
});

const renderEarnBalance = async ({
    stakingPositions = [],
    yieldPositions = [],
    currentRates,
}: {
    stakingPositions?: StakingListItem[];
    yieldPositions?: YieldListItem[];
    currentRates: Record<string, { rate: number }>;
}) =>
    await renderHookWithStoreProvider(() => useEarnBalance({ stakingPositions, yieldPositions }), {
        preloadedState: {
            wallet: {
                fiat: { current: currentRates, historic: {} },
                settings: { localCurrency: 'usd' },
            },
        },
    });

describe(useEarnBalance.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useMissingRateTickersQueryMock.mockReturnValue(createMissingRateTickersQueryResult());
    });

    it('reports a complete total when every position has a rate', async () => {
        const { result } = await renderEarnBalance({
            stakingPositions: [stakingPosition],
            yieldPositions: [createYieldPosition(USDC_CONTRACT_LOWERCASE)],
            currentRates: {
                [getFiatRateKey(ethSymbol, 'usd')]: { rate: 3_000 },
                [getFiatRateKey(ethSymbol, 'usd', USDC_CONTRACT_LOWERCASE)]: { rate: 1 },
            },
        });

        expect(result.current.totalStakingFiatAmount).toBe('6000');
        expect(result.current.totalYieldFiatAmount).toBe('4');
        expect(result.current.totalEarnFiatAmount).toBe('6004');
        expect(result.current.isFiatRatesLoading).toBe(false);
        expect(result.current.isFiatTotalIncomplete).toBe(false);
        expect(result.current.isFiatTotalUnavailable).toBe(false);
        expect(useMissingRateTickersQueryMock).toHaveBeenLastCalledWith({
            missingRateTickers: [],
            baseCurrencyCode: 'usd',
        });
    });

    it('requests the normalized token ticker and reports loading while the rate is fetched', async () => {
        useMissingRateTickersQueryMock.mockReturnValue(
            createMissingRateTickersQueryResult({ isFetching: true }),
        );

        const { result } = await renderEarnBalance({
            yieldPositions: [createYieldPosition(USDC_CONTRACT_CHECKSUMMED)],
            currentRates: {},
        });

        expect(useMissingRateTickersQueryMock).toHaveBeenLastCalledWith({
            missingRateTickers: [{ symbol: 'eth', tokenAddress: USDC_CONTRACT_LOWERCASE }],
            baseCurrencyCode: 'usd',
        });
        expect(result.current.totalEarnFiatAmount).toBe('0');
        expect(result.current.isFiatRatesLoading).toBe(true);
        expect(result.current.isFiatTotalIncomplete).toBe(false);
        expect(result.current.isFiatTotalUnavailable).toBe(false);
    });

    it('uses a rate stored under the blockbook token address casing without requesting it', async () => {
        const { result } = await renderEarnBalance({
            yieldPositions: [createYieldPosition(USDC_CONTRACT_LOWERCASE)],
            currentRates: {
                [getFiatRateKey(ethSymbol, 'usd', USDC_CONTRACT_CHECKSUMMED)]: { rate: 1 },
            },
        });

        expect(useMissingRateTickersQueryMock).toHaveBeenLastCalledWith({
            missingRateTickers: [],
            baseCurrencyCode: 'usd',
        });
        expect(result.current.totalYieldFiatAmount).toBe('4');
        expect(result.current.isFiatRatesLoading).toBe(false);
        expect(result.current.isFiatTotalIncomplete).toBe(false);
    });

    it('reports an unavailable total and allows retry when the only rate remains missing', async () => {
        const { result } = await renderEarnBalance({
            yieldPositions: [createYieldPosition(USDC_CONTRACT_LOWERCASE)],
            currentRates: {},
        });

        expect(result.current.isFiatRatesLoading).toBe(false);
        expect(result.current.isFiatTotalIncomplete).toBe(true);
        expect(result.current.isFiatTotalUnavailable).toBe(true);

        void result.current.retryMissingFiatRates();

        expect(refetchMissingRateTickersMock).toHaveBeenCalledTimes(1);
    });

    it('reports a lower-bound total when only some yield rates are available', async () => {
        const { result } = await renderEarnBalance({
            yieldPositions: [
                createYieldPosition(USDC_CONTRACT_LOWERCASE),
                createYieldPosition(DAI_CONTRACT_LOWERCASE, { id: 'vault-2', yieldId: 'vault-2' }),
            ],
            currentRates: {
                [getFiatRateKey(ethSymbol, 'usd', USDC_CONTRACT_LOWERCASE)]: { rate: 1 },
            },
        });

        expect(result.current.totalEarnFiatAmount).toBe('4');
        expect(result.current.isFiatTotalIncomplete).toBe(true);
        expect(result.current.isFiatTotalUnavailable).toBe(false);
    });

    it('reports a lower-bound total when the staking rate is missing but the yield rate is known', async () => {
        const { result } = await renderEarnBalance({
            stakingPositions: [stakingPosition],
            yieldPositions: [createYieldPosition(USDC_CONTRACT_LOWERCASE)],
            currentRates: {
                [getFiatRateKey(ethSymbol, 'usd', USDC_CONTRACT_LOWERCASE)]: { rate: 1 },
            },
        });

        expect(useMissingRateTickersQueryMock).toHaveBeenLastCalledWith({
            missingRateTickers: [{ symbol: 'eth' }],
            baseCurrencyCode: 'usd',
        });
        expect(result.current.totalStakingFiatAmount).toBe('0');
        expect(result.current.totalEarnFiatAmount).toBe('4');
        expect(result.current.isFiatTotalIncomplete).toBe(true);
        expect(result.current.isFiatTotalUnavailable).toBe(false);
    });

    it('does not report a position with an empty balance as missing a rate', async () => {
        const { result } = await renderEarnBalance({
            stakingPositions: [{ ...stakingPosition, balance: '0' }],
            yieldPositions: [createYieldPosition(USDC_CONTRACT_LOWERCASE, { tokenBalance: '0' })],
            currentRates: {},
        });

        expect(useMissingRateTickersQueryMock).toHaveBeenLastCalledWith({
            missingRateTickers: [],
            baseCurrencyCode: 'usd',
        });
        expect(result.current.totalEarnFiatAmount).toBe('0');
        expect(result.current.isFiatTotalIncomplete).toBe(false);
        expect(result.current.isFiatTotalUnavailable).toBe(false);
    });
});
