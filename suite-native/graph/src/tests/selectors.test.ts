import type { DeviceRootState } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectDeviceMainnetAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import {
    selectDeviceHistoryIgnoredNetworkSymbols,
    selectPortfolioGraphAccountItems,
} from '../selectors';

// Mock the dependencies
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectDeviceMainnetAccounts: jest.fn(),
}));

jest.mock('@suite-common/graph/src/constants', () => ({
    isIgnoredBalanceHistoryCoin: (symbol: NetworkSymbol) => ['sol', 'ada'].includes(symbol),
}));

const mockSelectDeviceMainnetAccounts = selectDeviceMainnetAccounts as jest.MockedFunction<
    typeof selectDeviceMainnetAccounts
>;
type TestState = DeviceRootState & AccountsRootState & TokenDefinitionsRootState;

describe('selectDeviceHistoryIgnoredNetworkSymbols', () => {
    let mockState: TestState;

    beforeEach(() => {
        jest.clearAllMocks();

        mockState = {
            device: {} as DeviceRootState['device'],
            wallet: {} as AccountsRootState['wallet'],
            tokenDefinitions: {} as TokenDefinitionsRootState['tokenDefinitions'],
        } as TestState;
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

describe('selectPortfolioGraphAccountItems', () => {
    let mockState: TestState;

    beforeEach(() => {
        jest.clearAllMocks();

        mockState = {
            device: {} as DeviceRootState['device'],
            wallet: {} as AccountsRootState['wallet'],
            tokenDefinitions: {} as TokenDefinitionsRootState['tokenDefinitions'],
        } as TestState;
    });

    it('returns the same array reference across calls when inputs are unchanged', () => {
        const accounts: Account[] = [
            {
                key: 'btc-key',
                symbol: 'btc' as NetworkSymbol,
                descriptor: 'btc-desc',
            } as unknown as Account,
            {
                key: 'eth-key',
                symbol: 'eth' as NetworkSymbol,
                descriptor: 'eth-desc',
            } as unknown as Account,
        ];

        mockSelectDeviceMainnetAccounts.mockReturnValue(accounts);

        const result1 = selectPortfolioGraphAccountItems(mockState);
        const result2 = selectPortfolioGraphAccountItems(mockState);

        expect(result1).toBe(result2);
        expect(result1).toHaveLength(2);
        expect(result1[0]).toMatchObject({
            symbol: 'btc',
            descriptor: 'btc-desc',
            accountKey: 'btc-key',
            tokensFilter: undefined,
        });
    });

    it('invalidates the cache when tokenDefinitions change so tokensFilter reflects fresh data', () => {
        const accounts: Account[] = [
            {
                key: 'eth-key',
                symbol: 'eth' as NetworkSymbol,
                descriptor: 'eth-desc',
                tokens: [{ contract: '0xabc' }],
            } as unknown as Account,
        ];

        mockSelectDeviceMainnetAccounts.mockReturnValue(accounts);

        const result1 = selectPortfolioGraphAccountItems(mockState);
        expect(result1[0].tokensFilter).toEqual([]);

        mockState = {
            ...mockState,
            tokenDefinitions: {
                eth: { coin: { data: ['0xabc'] } },
            } as TokenDefinitionsRootState['tokenDefinitions'],
        };

        const result2 = selectPortfolioGraphAccountItems(mockState);

        expect(result2).not.toBe(result1);
        expect(result2[0].tokensFilter).toEqual(['0xabc']);
    });
});
