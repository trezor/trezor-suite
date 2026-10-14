import type { DeviceRootState } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type NetworkSymbol,
    type TrezorConnectBackendType,
    asNetworkSymbol,
} from '@suite-common/wallet-config';
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
    selectIsHistoryEnabledAccountByAccountKey,
    selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning,
} from './selectors';

// Mock the dependencies
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectDeviceMainnetAccounts: jest.fn(),
    selectHasRunningDiscovery: jest.fn(),
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

// Only discovery reports the backend, so the mock leaves it out.
const withBackendType = (account: Account, backendType: TrezorConnectBackendType): Account => ({
    ...account,
    backendType,
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

    it('should return the network of an account on a direct-RPC backend', () => {
        const accounts: Account[] = [
            { symbol: 'btc' as NetworkSymbol } as Account,
            { symbol: 'arc' as NetworkSymbol, backendType: 'evm-rpc' } as Account,
            { symbol: 'eth' as NetworkSymbol, backendType: 'blockbook' } as Account,
        ];

        mockSelectDeviceMainnetAccounts.mockReturnValue(accounts);

        const result = selectDeviceHistoryIgnoredNetworkSymbols(mockState);

        expect(result).toEqual(['arc']);
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
            symbol: asNetworkSymbol('btc'),
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

    it('should keep an account on a direct-RPC backend in the items', () => {
        const account = withBackendType(
            mockWalletAccount({
                symbol: asNetworkSymbol('arc'),
                descriptor: asAccountDescriptor('0xarc'),
            }),
            'evm-rpc',
        );

        mockSelectDeviceMainnetAccounts.mockReturnValue([account]);

        const result = selectPortfolioGraphAccountItemsIfDiscoveryIsNotRunning(mockState);

        expect(result).toEqual([
            expect.objectContaining({
                symbol: 'arc',
                backendType: 'evm-rpc',
                descriptor: '0xarc',
                accountKey: account.key,
            }),
        ]);
    });

    it('should exclude accounts whose discovery failed', () => {
        const account = mockWalletAccount({
            symbol: asNetworkSymbol('btc'),
            descriptor: asAccountDescriptor('descriptor1'),
        });
        const failedAccount = mockWalletAccount(
            {
                symbol: asNetworkSymbol('btc'),
                descriptor: asAccountDescriptor('failed:16:btc:normal'),
            },
            undefined,
            { failed: true, error: 'Discovery failed' },
        );

        mockSelectDeviceMainnetAccounts.mockReturnValue([account, failedAccount]);

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

describe('selectIsHistoryEnabledAccountByAccountKey', () => {
    const buildState = (account: Account): TestState =>
        ({
            device: {} as DeviceRootState['device'],
            wallet: { accounts: [account] } as TestState['wallet'],
            tokenDefinitions: {} as TokenDefinitionsRootState['tokenDefinitions'],
        }) as TestState;

    it('should be false for an account on a direct-RPC backend', () => {
        const account = withBackendType(
            mockWalletAccount({ symbol: asNetworkSymbol('arc') }),
            'evm-rpc',
        );

        expect(selectIsHistoryEnabledAccountByAccountKey(buildState(account), account.key)).toBe(
            false,
        );
    });

    it('should be true for an account on a blockbook backend', () => {
        const account = withBackendType(
            mockWalletAccount({ symbol: asNetworkSymbol('eth') }),
            'blockbook',
        );

        expect(selectIsHistoryEnabledAccountByAccountKey(buildState(account), account.key)).toBe(
            true,
        );
    });
});
