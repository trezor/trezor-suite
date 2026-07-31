import { type AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';
import {
    type Account,
    type TokenInfoBranded,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    getAccountListSections,
    selectFreshAccountAddress,
    selectHasDeviceAnyFailedAccountForNetworkSymbol,
    selectIsAccountDiscoveryFailed,
} from './selectors';
import { isFilterValueMatchingAccount, sortAccountsByNetworksAndAccountTypes } from './utils';

let mockStakingBalance = '0';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAccountTotalStakingBalance: (_: Account) => mockStakingBalance,
}));

describe('isFilterValueMatchingAccountLabelOrNetworkName', () => {
    const account = {
        label: 'Original account name',
        symbol: 'eth',
        accountType: 'legacy',
        tokens: [{ name: 'Tether USD' }],
    } as AccountWithSuiteSyncLabel;

    test('should return false if the filter value does not match the account label nor network name.', () => {
        const filterValue = 'not match';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(false);
    });

    test('should return false if the filter value does not match the network name.', () => {
        const filterValue = 'bitcoin';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(false);
    });

    test('should return true if filter value matches the network name', () => {
        const filterValue = 'ethereum';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(true);
    });

    test('should return true if filter value matches the account type: legacy', () => {
        const filterValue = 'legacy';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(true);
    });

    test('should return true if filter value matches the account type: taproot', () => {
        const filterValue = 'taproot';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(false);
    });

    test('should return true if filter value matches the included token name', () => {
        const filterValue = 'tether';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(true);
    });

    test('should return true if filter value does match the account label', () => {
        const filterValue = 'Original account';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(true);
    });
});

describe('sortAccountsByNetworksAndAccountTypes', () => {
    it('accounts sorted by network and account type', () => {
        const fixtureAccounts = [
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'taproot' },
            { symbol: 'eth', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'segwit' },
            { symbol: 'btc', accountType: 'legacy' },
            { symbol: 'btc', accountType: 'segwit' },
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'normal' },
        ] as unknown as Account[];

        const result = sortAccountsByNetworksAndAccountTypes(fixtureAccounts);

        expect(result).toEqual([
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'taproot' },
            { symbol: 'btc', accountType: 'segwit' },
            { symbol: 'btc', accountType: 'legacy' },
            { symbol: 'eth', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'segwit' },
        ]);
    });
});

describe('selectFreshAccountAddress', () => {
    const mockAccount = {
        symbol: 'btc',
        key: mockAccountKey({ symbol: 'btc', descriptor: 'btc1' }),
        addresses: {
            unused: [
                {
                    address: 'unused1',
                    path: "m/44'/0'/0'/0/0",
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
                {
                    address: 'unused2',
                    path: "m/44'/0'/0'/0/1",
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            ],
            used: [
                {
                    address: 'used1',
                    path: "m/44'/0'/0'/0/2",
                    transfers: 1,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
                {
                    address: 'used2',
                    path: "m/44'/0'/0'/0/3",
                    transfers: 1,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            ],
            change: [],
        },
        deviceState: 'device@state:1',
        index: 0,
        path: "m/44'/0'/0'",
        descriptor: asAccountDescriptor('descriptor'),
        accountType: 'normal',
        empty: false,
        visible: true,
        balance: '0',
        availableBalance: '0',
        formattedBalance: '0',
        tokens: [],
        utxo: [],
        history: {
            total: 0,
            unconfirmed: 0,
        },
        metadata: {
            key: 'btc-1',
        },
        ts: 0,
        networkType: 'bitcoin',
        misc: undefined,
        marker: undefined,
        page: undefined,
        stellarCursor: undefined,
    } as Account;

    const mockState = {
        wallet: {
            accounts: [mockAccount],
            pendingAccountAddresses: {},
            transactions: {
                transactions: {},
                phishing: {},
                fetchStatusDetail: {},
            },
        },
    };

    it('should return null when account is not provided', () => {
        const result = selectFreshAccountAddress(
            mockState,
            mockAccountKey({ descriptor: 'nonExistentKey' }),
        );
        expect(result).toBeNull();
    });

    it('should return first unused address for account', () => {
        const result = selectFreshAccountAddress(mockState, mockAccount.key);
        expect(result).toEqual({
            address: 'unused1',
            path: "m/44'/0'/0'/0/0",
            transfers: 0,
            balance: '0',
            sent: '0',
            received: '0',
        });
    });

    it('should return undefined when no unused addresses are available', () => {
        const accountWithoutUnused = {
            ...mockAccount,
            addresses: {
                unused: [],
                used: [
                    {
                        address: 'used1',
                        path: "m/44'/0'/0'/0/2",
                        transfers: 1,
                        balance: '0',
                        sent: '0',
                        received: '0',
                    },
                ],
                change: [],
            },
        };
        const stateWithoutUnused = {
            wallet: {
                accounts: [accountWithoutUnused],
                pendingAccountAddresses: {},
                transactions: {
                    transactions: {},
                    phishing: {},
                    fetchStatusDetail: {},
                },
            },
        };
        const result = selectFreshAccountAddress(stateWithoutUnused, accountWithoutUnused.key);
        expect(result).toBeUndefined();
    });

    it('should return stable results for same inputs', () => {
        const result1 = selectFreshAccountAddress(mockState, mockAccount.key);
        const result2 = selectFreshAccountAddress(mockState, mockAccount.key);

        expect(result1).toEqual(result2);
        expect(result1).toBe(result2);
    });
});

describe('getAccountListSections', () => {
    const mockAccount = {
        symbol: 'eth',
        accountType: 'normal',
        balance: '100',
        availableBalance: '100',
        formattedBalance: '100',
        tokens: [
            {
                name: 'Token1',
                balance: '100',
                contract: '0x1',
                standard: 'ERC20',
                decimals: 18,
            },
            {
                name: 'Token2',
                balance: '0',
                contract: '0x2',
                standard: 'ERC20',
                decimals: 18,
            },
            {
                name: 'Token3',
                balance: '50',
                contract: '0x3',
                standard: 'ERC20',
                decimals: 18,
            },
        ] as TokenInfoBranded[],
        networkType: 'ethereum',
    } as any as Account;

    const mockTokenDefinitions = ['0x1', '0x2', '0x3'];
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should include only tokens with positive balance', () => {
        mockStakingBalance = '0';

        const sections = getAccountListSections(mockAccount, mockTokenDefinitions);

        // Should have account section and two token sections (for Token1 and Token3)
        expect(sections).toHaveLength(3);

        // Verify token sections only include tokens with positive balance
        const tokenSections = sections.filter(section => section.type === 'token');
        expect(tokenSections).toHaveLength(2);

        const tokenNames = tokenSections.map(section => section.token.name);
        expect(tokenNames).toEqual(['Token1', 'Token3']);
    });

    it('should handle account with no tokens', () => {
        const accountWithoutTokens: Account = {
            ...mockAccount,
            tokens: [],
        };

        const sections = getAccountListSections(accountWithoutTokens, mockTokenDefinitions);

        // Should only have account section
        expect(sections).toHaveLength(1);
        expect(sections[0]?.type).toBe('account');
    });

    it('should handle account with only zero balance tokens', () => {
        mockStakingBalance = '0';

        const accountWithZeroBalanceTokens: Account = {
            ...mockAccount,
            tokens: [
                {
                    name: 'Token1',
                    balance: '0',
                    contract: '0x1',
                    standard: 'ERC20',
                    decimals: 18,
                },
                {
                    name: 'Token2',
                    balance: '0',
                    contract: '0x2',
                    standard: 'ERC20',
                    decimals: 18,
                },
            ] as TokenInfoBranded[],
        };

        const sections = getAccountListSections(accountWithZeroBalanceTokens, mockTokenDefinitions);

        // Should only have account section
        expect(sections).toHaveLength(1);
        expect(sections[0]?.type).toBe('account');
    });

    it('should handle account with staking balance', () => {
        mockStakingBalance = '100';

        const sections = getAccountListSections(mockAccount, mockTokenDefinitions);

        // Should have account section, staking section, and two token sections
        expect(sections).toHaveLength(4);
        expect(sections[0]?.type).toBe('account');
        expect(sections[1]?.type).toBe('staking');
        expect(sections[2]?.type).toBe('token');
        expect(sections[3]?.type).toBe('token');
    });
});

describe('selectIsAccountDiscoveryFailed', () => {
    const staticSessionId = 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@ABC123:1';

    const failedAccount = {
        key: `failed:0:sol:normal-sol-${staticSessionId}`,
        descriptor: 'failed:0:sol:normal',
        symbol: 'sol',
        accountType: 'normal',
        index: 0,
        deviceState: staticSessionId,
        visible: true,
        failed: true,
        error: 'Network request failed',
    } as unknown as Account;

    const normalAccount = {
        key: `descriptor1-sol-${staticSessionId}`,
        descriptor: 'descriptor1',
        symbol: 'sol',
        accountType: 'normal',
        index: 0,
        deviceState: staticSessionId,
        visible: true,
    } as unknown as Account;

    const getState = (accounts: Account[]) =>
        ({
            wallet: { accounts },
            device: { selectedDevice: { state: { staticSessionId } }, devices: [] },
        }) as any;

    it('returns true for a failed account', () => {
        expect(selectIsAccountDiscoveryFailed(getState([failedAccount]), failedAccount.key)).toBe(
            true,
        );
    });

    it('returns false for a normal account', () => {
        expect(selectIsAccountDiscoveryFailed(getState([normalAccount]), normalAccount.key)).toBe(
            false,
        );
    });

    it('returns false for an unknown account key', () => {
        expect(selectIsAccountDiscoveryFailed(getState([normalAccount]), failedAccount.key)).toBe(
            false,
        );
    });

    describe('selectHasDeviceAnyFailedAccountForNetworkSymbol', () => {
        it('returns true when any account of the network failed', () => {
            expect(
                selectHasDeviceAnyFailedAccountForNetworkSymbol(
                    getState([normalAccount, failedAccount]),
                    'sol',
                ),
            ).toBe(true);
        });

        it('returns false when no account of the network failed', () => {
            expect(
                selectHasDeviceAnyFailedAccountForNetworkSymbol(getState([normalAccount]), 'sol'),
            ).toBe(false);
        });

        it('returns false for another network', () => {
            expect(
                selectHasDeviceAnyFailedAccountForNetworkSymbol(getState([failedAccount]), 'btc'),
            ).toBe(false);
        });
    });
});
