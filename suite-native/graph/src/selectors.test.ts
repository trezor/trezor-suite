import type { DeviceRootState } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    selectDeviceMainnetAccounts,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    selectDeviceHistoryIgnoredNetworkSymbols,
    selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning,
} from './selectors';

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
    TokenDefinitionsRootState;

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
