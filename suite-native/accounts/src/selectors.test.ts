import { type AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { type TokenInfoBranded, toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import { fiatRatesInitialState, initialWalletSettingsState } from '@suite-common/wallet-core';
import { mockStakeRootState } from '@suite-common/wallet-core/mocks';
import {
    type Account,
    type CurrentRate,
    type Timestamp,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import {
    mockAccountKey,
    mockAccountToken,
    mockEthereumStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import {
    type NativeAccountsRootState,
    getAccountListSections,
    selectAccountFiatBalance,
    selectAccountListSectionsWithZeroBalanceGroup,
    selectAccountVisibleTokensCount,
    selectFreshAccountAddress,
    selectHasDeviceAnyFailedAccountForNetworkSymbol,
    selectIsAccountDiscoveryFailed,
} from './selectors';
import { isFilterValueMatchingAccount, sortAccountsByNetworksAndAccountTypes } from './utils';

const supportedNetworks = mockGetSupportedNetworks();

const btcSymbol = asNetworkSymbol('btc');
const solSymbol = asNetworkSymbol('sol');

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

        const result = sortAccountsByNetworksAndAccountTypes(fixtureAccounts, supportedNetworks);

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
        symbol: btcSymbol,
        key: mockAccountKey({ symbol: btcSymbol, descriptor: 'btc1' }),
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

    const mockTokenDefinitions = {
        data: ['0x1', '0x2', '0x3'],
        hide: [],
        show: [],
        error: false,
        isLoading: false,
    };
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
                    solSymbol,
                ),
            ).toBe(true);
        });

        it('returns false when no account of the network failed', () => {
            expect(
                selectHasDeviceAnyFailedAccountForNetworkSymbol(
                    getState([normalAccount]),
                    solSymbol,
                ),
            ).toBe(false);
        });

        it('returns false for another network', () => {
            expect(
                selectHasDeviceAnyFailedAccountForNetworkSymbol(
                    getState([failedAccount]),
                    btcSymbol,
                ),
            ).toBe(false);
        });
    });
});

describe('selectAccountFiatBalance', () => {
    const symbol = asNetworkSymbol('eth');
    const visibleContract = toTokenAddress('0x' + 'a'.repeat(40));
    const hiddenContract = toTokenAddress('0x' + 'b'.repeat(40));
    const unverifiedContract = toTokenAddress('0x' + 'c'.repeat(40));
    const nftContract = toTokenAddress('0x' + 'd'.repeat(40));
    const zeroBalanceContract = toTokenAddress('0x' + 'e'.repeat(40));
    const account = mockEthereumStakingAccount('active', {
        tokens: [
            mockAccountToken({ contract: visibleContract, balance: '250' }),
            mockAccountToken({ contract: hiddenContract, balance: '900' }),
            mockAccountToken({ contract: unverifiedContract, balance: '100' }),
            mockAccountToken({ contract: nftContract, standard: 'ERC721', balance: '1' }),
            mockAccountToken({ contract: zeroBalanceContract, balance: '0' }),
        ],
    });
    const createRate = (rate: number): CurrentRate => ({
        ticker: { symbol },
        rate,
        usdRate: rate,
        lastTickerTimestamp: 1700000000000 as Timestamp,
        lastSuccessfulFetchTimestamp: 1700000000000 as Timestamp,
        isLoading: false,
        error: null,
    });
    const createState = (hide = [hiddenContract], show: string[] = []): NativeAccountsRootState => {
        const state = mockStakeRootState({ accounts: [account] });

        return {
            ...state,
            wallet: {
                ...state.wallet,
                settings: { ...initialWalletSettingsState, localCurrency: 'usd' },
                fiat: {
                    ...fiatRatesInitialState,
                    current: {
                        [getFiatRateKey(symbol, 'usd')]: createRate(2000),
                        ...Object.fromEntries(
                            [visibleContract, hiddenContract, unverifiedContract].map(contract => [
                                getFiatRateKey(symbol, 'usd', contract),
                                createRate(1),
                            ]),
                        ),
                    },
                },
            },
            suiteSyncData: { wallets: {} },
            tokenDefinitions: {
                [symbol]: {
                    coin: {
                        data: [visibleContract, hiddenContract, nftContract, zeroBalanceContract],
                        hide,
                        show,
                        error: false,
                        isLoading: false,
                    },
                },
            },
        };
    };

    it('includes staking and visible tokens, excluding hidden and unverified tokens', () => {
        expect(selectAccountFiatBalance(createState(), account.key).toString()).toBe('7350');
    });

    it('uses the same visible fungible tokens for the total, token count and list', () => {
        const state = createState();
        const sections = selectAccountListSectionsWithZeroBalanceGroup(state, account.key);

        expect(selectAccountFiatBalance(state, account.key).toString()).toBe('7350');
        expect(selectAccountVisibleTokensCount(state, account.key)).toBe(1);
        expect(
            sections
                .filter(section => section.type === 'token')
                .map(section => section.token.contract),
        ).toEqual([visibleContract]);
        expect(
            sections
                .find(section => section.type === 'zeroBalance')
                ?.tokens.map(token => token.contract),
        ).toEqual([zeroBalanceContract]);
    });

    it('gives a manually shown token the same priority as desktop over the hidden list', () => {
        const state = createState([visibleContract, hiddenContract], [visibleContract]);

        expect(selectAccountVisibleTokensCount(state, account.key)).toBe(1);
        expect(
            selectAccountListSectionsWithZeroBalanceGroup(state, account.key)
                .filter(section => section.type === 'token')
                .map(section => section.token.contract),
        ).toEqual([visibleContract]);
    });

    it('keeps a checksummed hidden token out of the count, list and total', () => {
        const state = createState();
        state.wallet.accounts = [
            {
                ...account,
                tokens: account.tokens?.map(token =>
                    token.contract === hiddenContract
                        ? { ...token, contract: toTokenAddress('0x' + 'B'.repeat(40)) }
                        : token,
                ),
            },
        ];

        expect(selectAccountVisibleTokensCount(state, account.key)).toBe(1);
        expect(selectAccountFiatBalance(state, account.key).toString()).toBe('7350');
        expect(
            selectAccountListSectionsWithZeroBalanceGroup(state, account.key)
                .filter(section => section.type === 'token')
                .map(section => section.token.contract),
        ).toEqual([visibleContract]);
    });

    it('includes a manually shown token regardless of EVM contract casing', () => {
        const state = createState([hiddenContract], ['0x' + 'C'.repeat(40)]);

        expect(selectAccountVisibleTokensCount(state, account.key)).toBe(2);
        expect(selectAccountFiatBalance(state, account.key).toString()).toBe('7450');
        expect(
            selectAccountListSectionsWithZeroBalanceGroup(state, account.key)
                .filter(section => section.type === 'token')
                .map(section => section.token.contract),
        ).toEqual([visibleContract, unverifiedContract]);
    });

    it('counts a visible DeFi token once without duplicating it in the regular token list', () => {
        const state = createState();
        state.wallet.accounts = [
            {
                ...account,
                tokens: account.tokens?.map(token =>
                    token.contract === visibleContract
                        ? { ...token, protocols: ['erc4626'] }
                        : token,
                ),
            },
        ];

        expect(selectAccountVisibleTokensCount(state, account.key)).toBe(1);
        expect(selectAccountFiatBalance(state, account.key).toString()).toBe('7350');
        expect(
            selectAccountListSectionsWithZeroBalanceGroup(state, account.key).filter(
                section => section.type === 'token',
            ),
        ).toHaveLength(0);
    });

    it('updates the total when a token is hidden or shown', () => {
        const shown = selectAccountFiatBalance(createState([]), account.key);
        const hidden = selectAccountFiatBalance(
            createState([visibleContract, hiddenContract]),
            account.key,
        );

        expect(shown.toString()).toBe('8250');
        expect(hidden.toString()).toBe('7100');
    });

    it('includes an unverified token after it is manually shown', () => {
        expect(
            selectAccountFiatBalance(
                createState([hiddenContract], [unverifiedContract]),
                account.key,
            ).toString(),
        ).toBe('7450');
    });

    it('preserves the options to exclude staking or tokens', () => {
        const state = createState();

        expect(selectAccountFiatBalance(state, account.key, false).toString()).toBe('3250');
        expect(selectAccountFiatBalance(state, account.key, true, false).toString()).toBe('7100');
        expect(selectAccountFiatBalance(state, account.key, false, false).toString()).toBe('3000');
    });

    it('returns zero for an unknown account', () => {
        expect(selectAccountFiatBalance(createState(), mockAccountKey()).toString()).toBe('0');
        expect(selectAccountVisibleTokensCount(createState(), mockAccountKey())).toBe(0);
    });
});
