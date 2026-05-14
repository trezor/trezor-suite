import type { DeviceRootState } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectDeviceMainnetAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { selectDeviceHistoryIgnoredNetworkSymbols } from '../selectors';

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
