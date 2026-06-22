import type { DeviceRootState } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectDeviceMainnetAccounts,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountWithNetworkType,
    asAccountDescriptor,
    asCryptoBaseCurrencyCode,
    asTimestamp,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    selectDeviceHistoryIgnoredNetworkSymbols,
    selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning,
    selectPortfolioGraphTotalFiatBalance,
} from '../selectors';

// Mock the dependencies
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectDeviceMainnetAccounts: jest.fn(),
    selectHasRunningDiscovery: jest.fn(),
}));

jest.mock('@suite-common/graph/src/constants', () => ({
    isIgnoredBalanceHistoryCoin: (symbol: NetworkSymbol) => ['sol', 'ada'].includes(symbol),
}));

const mockSelectDeviceMainnetAccounts = selectDeviceMainnetAccounts as jest.MockedFunction<
    typeof selectDeviceMainnetAccounts
>;
const mockSelectHasRunningDiscovery = selectHasRunningDiscovery as jest.MockedFunction<
    typeof selectHasRunningDiscovery
>;
type TestState = DeviceRootState &
    AccountsRootState &
    DiscoveryRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    TokenDefinitionsRootState;

const TEST_SESSION_ID = 'address@hash:0' as const;

const buildPortfolioGraphBalanceState = (account: Account) =>
    ({
        device: {
            selectedDevice: {
                state: { staticSessionId: TEST_SESSION_ID },
            },
        },
        wallet: {
            accounts: [account],
            settings: {
                localCurrency: 'usd',
            },
            fiat: {
                current: {
                    [asCryptoBaseCurrencyCode(`${account.symbol}-usd`)]: {
                        rate: 10,
                        lastTickerTimestamp: asTimestamp(1),
                        lastSuccessfulFetchTimestamp: asTimestamp(1),
                        isLoading: false,
                        error: null,
                        ticker: { symbol: 'btc' },
                    },
                },
            },
        },
        tokenDefinitions: {},
    }) as unknown as TestState;

const buildBalanceAccount = (formattedBalance: string) =>
    mockWalletAccount({
        symbol: 'btc',
        descriptor: asAccountDescriptor('btc'),
        deviceState: TEST_SESSION_ID,
        formattedBalance,
    });

const buildEthereumClassicAccountWithStakingData = (): AccountWithNetworkType<'ethereum'> => ({
    ...mockWalletAccount({
        symbol: 'etc',
        descriptor: asAccountDescriptor('etc'),
        deviceState: TEST_SESSION_ID,
        formattedBalance: '2',
    }),
    networkType: 'ethereum',
    marker: undefined,
    stellarCursor: undefined,
    page: { index: 1, size: 25, total: 1 },
    misc: {
        nonce: '0',
        stakingPools: [
            {
                contract: '0x0',
                name: 'Everstake',
                autocompoundBalance: '5',
                pendingBalance: '0',
                pendingDepositedBalance: '0',
                depositedBalance: '0',
                withdrawTotalAmount: '0',
                claimableAmount: '0',
                restakedReward: '0',
            },
        ],
    },
});

describe('selectDeviceHistoryIgnoredNetworkSymbols', () => {
    let mockState: TestState;

    beforeEach(() => {
        jest.clearAllMocks();

        mockState = {
            device: {} as DeviceRootState['device'],
            wallet: {} as TestState['wallet'],
            tokenDefinitions: {} as TokenDefinitionsRootState['tokenDefinitions'],
        } as TestState;

        mockSelectHasRunningDiscovery.mockReturnValue(false);
    });

    it('should return empty array when no accounts are present', () => {
        mockSelectDeviceMainnetAccounts.mockReturnValue([]);

        const result = selectDeviceHistoryIgnoredNetworkSymbols(mockState);

        expect(result).toEqual([]);
        expect(mockSelectDeviceMainnetAccounts).toHaveBeenCalledWith(mockState);
    });

    it('should return ignored network symbols', () => {
        const accounts: Account[] = [
            { symbol: 'btc' as NetworkSymbol } as Account,
            { symbol: 'sol' as NetworkSymbol } as Account,
            { symbol: 'ada' as NetworkSymbol } as Account,
            { symbol: 'eth' as NetworkSymbol } as Account,
        ];

        mockSelectDeviceMainnetAccounts.mockReturnValue(accounts);

        const result = selectDeviceHistoryIgnoredNetworkSymbols(mockState);

        expect(result).toEqual(['sol', 'ada']);
    });

    it('should return unique ignored network symbols', () => {
        const accounts: Account[] = [
            { symbol: 'btc' as NetworkSymbol } as Account,
            { symbol: 'sol' as NetworkSymbol } as Account,
            { symbol: 'sol' as NetworkSymbol } as Account,
            { symbol: 'ada' as NetworkSymbol } as Account,
            { symbol: 'ada' as NetworkSymbol } as Account,
        ];

        mockSelectDeviceMainnetAccounts.mockReturnValue(accounts);

        const result = selectDeviceHistoryIgnoredNetworkSymbols(mockState);

        expect(result).toEqual(['sol', 'ada']);
    });

    it('should return empty array when accounts array is empty', () => {
        mockSelectDeviceMainnetAccounts.mockReturnValue([]);

        const result = selectDeviceHistoryIgnoredNetworkSymbols(mockState);

        expect(result).toEqual([]);
    });

    it('should be stable', () => {
        const accounts: Account[] = [
            { symbol: 'sol' as NetworkSymbol } as Account,
            { symbol: 'ada' as NetworkSymbol } as Account,
            { symbol: 'btc' as NetworkSymbol } as Account,
        ];

        mockSelectDeviceMainnetAccounts.mockReturnValue(accounts);

        // First call
        const result1 = selectDeviceHistoryIgnoredNetworkSymbols(mockState);

        // Second call with same state
        const result2 = selectDeviceHistoryIgnoredNetworkSymbols(mockState);

        expect(result1).toBe(result2);
    });
});

describe('selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning', () => {
    let mockState: TestState;

    beforeEach(() => {
        jest.clearAllMocks();

        mockState = {
            device: {} as DeviceRootState['device'],
            wallet: {} as TestState['wallet'],
            tokenDefinitions: {} as TokenDefinitionsRootState['tokenDefinitions'],
        } as TestState;

        mockSelectHasRunningDiscovery.mockReturnValue(false);
    });

    it('should return stable empty account items while discovery is running', () => {
        mockSelectHasRunningDiscovery.mockReturnValue(true);

        const result1 = selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning(mockState);
        const result2 = selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning(mockState);

        expect(result1).toEqual([]);
        expect(result1).toBe(result2);
        expect(mockSelectDeviceMainnetAccounts).not.toHaveBeenCalled();
    });

    it('should return portfolio graph account items when discovery is not running', () => {
        const account = mockWalletAccount({
            symbol: 'btc',
            descriptor: asAccountDescriptor('descriptor1'),
        });

        mockSelectDeviceMainnetAccounts.mockReturnValue([account]);

        const result = selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning(mockState);

        expect(result).toEqual([
            {
                symbol: 'btc',
                descriptor: 'descriptor1',
                identity: undefined,
                accountKey: account.key,
                tokensFilter: [],
            },
        ]);
    });
});

describe('selectPortfolioGraphTotalFiatBalance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns the same reference when updated account objects have the same fiat balance', () => {
        mockSelectHasRunningDiscovery.mockReturnValue(false);

        const firstBalance = selectPortfolioGraphTotalFiatBalance(
            buildPortfolioGraphBalanceState(buildBalanceAccount('2')),
        );
        const secondBalance = selectPortfolioGraphTotalFiatBalance(
            buildPortfolioGraphBalanceState(buildBalanceAccount('2')),
        );

        expect(firstBalance?.toFixed()).toBe('20');
        expect(firstBalance).toBe(secondBalance);
    });

    it('returns a new reference when the fiat balance changes', () => {
        mockSelectHasRunningDiscovery.mockReturnValue(false);

        const firstBalance = selectPortfolioGraphTotalFiatBalance(
            buildPortfolioGraphBalanceState(buildBalanceAccount('2')),
        );
        const secondBalance = selectPortfolioGraphTotalFiatBalance(
            buildPortfolioGraphBalanceState(buildBalanceAccount('3')),
        );

        expect(secondBalance?.toFixed()).toBe('30');
        expect(secondBalance).not.toBe(firstBalance);
    });

    it('returns undefined while discovery is running', () => {
        mockSelectHasRunningDiscovery.mockReturnValue(true);

        expect(
            selectPortfolioGraphTotalFiatBalance(
                buildPortfolioGraphBalanceState(buildBalanceAccount('2')),
            ),
        ).toBeUndefined();
    });

    it('keeps native staking inclusion semantics for unsupported staking symbols', () => {
        mockSelectHasRunningDiscovery.mockReturnValue(false);

        const totalFiatBalance = selectPortfolioGraphTotalFiatBalance(
            buildPortfolioGraphBalanceState(buildEthereumClassicAccountWithStakingData()),
        );

        expect(totalFiatBalance?.toFixed()).toBe('20');
    });
});
