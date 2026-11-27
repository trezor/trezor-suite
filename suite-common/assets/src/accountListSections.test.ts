import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { type TokenAddress, type TokenInfoBranded } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { fiatRatesInitialState, initialWalletSettingsState } from '@suite-common/wallet-core';
import { mockStakeRootState } from '@suite-common/wallet-core/mocks';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    mockAccountToken,
    mockEthereumStakingAccount,
    mockWalletAccount,
} from '@suite-common/wallet-types/mocks';

import {
    type AccountListSection,
    type AccountListSectionsRootState,
    getAccountListSections,
    isAccountListSectionMatchingSearch,
    normalizeAssetSearchQuery,
    selectAccountAssetOverview,
    selectAccountListSectionsWithZeroBalanceGroup,
} from './accountListSections';

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

    const idleStaking = { isStakingActive: false, stakingCryptoBalance: '0' };

    it('should include only tokens with positive balance', () => {
        const sections = getAccountListSections({
            account: mockAccount,
            tokenDefinitions: mockTokenDefinitions,
            ...idleStaking,
        });

        // Should have account section and two token sections (for Token1 and Token3)
        expect(sections).toHaveLength(3);

        // Verify token sections only include tokens with positive balance
        const tokenSections = sections.filter(section => section.type === 'token');
        expect(tokenSections).toHaveLength(2);

        const tokenNames = tokenSections.map(section => section.token.name);
        expect(tokenNames).toEqual(['Token1', 'Token3']);
    });

    it('lists a vault token among the tokens only where asked, as mobile keeps it in its DeFi tab', () => {
        const accountWithVaultToken = {
            ...mockAccount,
            tokens: [{ ...mockAccount.tokens?.[0], protocols: ['erc4626'] }],
        } as Account;
        const tokenNames = (areVaultTokensListed: boolean) =>
            getAccountListSections({
                account: accountWithVaultToken,
                tokenDefinitions: mockTokenDefinitions,
                areVaultTokensListed,
                ...idleStaking,
            })
                .filter(section => section.type === 'token')
                .map(section => section.token.name);

        expect(tokenNames(false)).toEqual([]);
        expect(tokenNames(true)).toEqual(['Token1']);
    });

    it('should handle account with no tokens', () => {
        const accountWithoutTokens: Account = {
            ...mockAccount,
            tokens: [],
        };

        const sections = getAccountListSections({
            account: accountWithoutTokens,
            tokenDefinitions: mockTokenDefinitions,
            ...idleStaking,
        });

        // Should only have account section
        expect(sections).toHaveLength(1);
        expect(sections[0]?.type).toBe('account');
    });

    it('should handle account with only zero balance tokens', () => {
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

        const sections = getAccountListSections({
            account: accountWithZeroBalanceTokens,
            tokenDefinitions: mockTokenDefinitions,
            ...idleStaking,
        });

        // Should only have account section
        expect(sections).toHaveLength(1);
        expect(sections[0]?.type).toBe('account');
    });

    it('should handle an account with active staking', () => {
        const sections = getAccountListSections({
            account: mockAccount,
            tokenDefinitions: mockTokenDefinitions,
            isStakingActive: true,
            stakingCryptoBalance: '100',
        });

        // Should have account section, staking section, and two token sections
        expect(sections).toHaveLength(4);
        expect(sections[0]?.type).toBe('account');
        expect(sections[1]).toMatchObject({ type: 'staking', stakingCryptoBalance: '100' });
        expect(sections[2]?.type).toBe('token');
        expect(sections[3]?.type).toBe('token');
    });
});

describe('selectAccountListSectionsWithZeroBalanceGroup', () => {
    const stakingAccount = mockEthereumStakingAccount('active');
    const idleAccount = mockEthereumStakingAccount('none');
    const createState = (): AccountListSectionsRootState => {
        const state = mockStakeRootState({ accounts: [stakingAccount, idleAccount] });

        return {
            ...state,
            wallet: {
                ...state.wallet,
                settings: { ...initialWalletSettingsState, localCurrency: 'usd' },
                fiat: fiatRatesInitialState,
            },
            earn: {
                staking: mockStakingState({
                    positions: {
                        [stakingAccount.key]: [
                            mockStakingPosition({
                                balances: {
                                    staked: stakingAmountSchema.parse('2050000000000000000'),
                                    pending: stakingAmountSchema.parse('0'),
                                    unstaking: stakingAmountSchema.parse('0'),
                                    withdrawable: stakingAmountSchema.parse('0'),
                                    rewards: stakingAmountSchema.parse('0'),
                                },
                                unlocks: [],
                            }),
                        ],
                    },
                }),
            },
            tokenDefinitions: {},
        };
    };

    it('adds a staking section with the position amount of an active account', () => {
        const sections = selectAccountListSectionsWithZeroBalanceGroup(
            createState(),
            stakingAccount.key,
        );

        expect(sections.map(section => section.type)).toEqual(['account', 'staking']);
        expect(sections[1]).toMatchObject({ type: 'staking', stakingCryptoBalance: '2.05' });
    });

    it('lists only the account section without a position', () => {
        const sections = selectAccountListSectionsWithZeroBalanceGroup(
            createState(),
            idleAccount.key,
        );

        expect(sections.map(section => section.type)).toEqual(['account']);
    });

    it('keeps the sections reference while the state is unchanged', () => {
        const state = createState();

        expect(selectAccountListSectionsWithZeroBalanceGroup(state, stakingAccount.key)).toBe(
            selectAccountListSectionsWithZeroBalanceGroup(state, stakingAccount.key),
        );
    });
});

describe('selectAccountAssetOverview', () => {
    const ETH = asNetworkSymbol('eth');
    const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
    const ENS = '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72' as TokenAddress;
    const createState = (account: Account) => {
        const baseState = mockStakeRootState({ accounts: [account] });

        return {
            ...baseState,
            wallet: {
                ...baseState.wallet,
                settings: { ...initialWalletSettingsState, localCurrency: 'usd' },
                fiat: fiatRatesInitialState,
            },
            earn: { staking: mockStakingState() },
            tokenDefinitions: {
                [ETH]: {
                    coin: { data: [USDC, ENS], hide: [], show: [], error: false, isLoading: false },
                },
            },
        } as unknown as AccountListSectionsRootState;
    };
    const tokens = [
        mockAccountToken({ symbol: 'USDC', contract: USDC, balance: '1000', decimals: 6 }),
        mockAccountToken({ symbol: 'ENS', contract: ENS, balance: '0', decimals: 18 }),
    ];
    const typesOf = (sections: readonly { type: string }[]) => sections.map(({ type }) => type);

    it('splits what the account holds from the tokens it holds none of, and counts its assets', () => {
        const account = mockWalletAccount({ symbol: ETH, formattedBalance: '1.2', tokens });
        const overview = selectAccountAssetOverview(createState(account), account.key);

        expect(typesOf(overview.heldSections)).toEqual(['account', 'token']);
        expect(overview.zeroBalanceSections).toMatchObject([
            { type: 'token', token: { symbol: 'ENS' } },
        ]);
        expect(overview.assetCount).toBe(2);
    });

    it('leaves out a coin the account holds none of', () => {
        const account = mockWalletAccount({ symbol: ETH, formattedBalance: '0', tokens });
        const overview = selectAccountAssetOverview(createState(account), account.key);

        expect(typesOf(overview.heldSections)).toEqual(['token']);
        expect(overview.assetCount).toBe(1);
    });

    it('holds nothing for an account it does not know', () => {
        const account = mockWalletAccount({ symbol: ETH, formattedBalance: '1.2', tokens });

        expect(selectAccountAssetOverview(createState(account), 'unknown' as AccountKey)).toEqual({
            heldSections: [],
            zeroBalanceSections: [],
            assetCount: 0,
        });
    });
});

describe(isAccountListSectionMatchingSearch.name, () => {
    const ETH = asNetworkSymbol('eth');
    const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
    const ENS = '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72' as TokenAddress;
    const usdc = mockAccountToken({
        symbol: 'USDC',
        contract: USDC,
        balance: '1000',
    }) as TokenInfoBranded;
    const ens = mockAccountToken({
        symbol: 'ENS',
        contract: ENS,
        balance: '0',
    }) as TokenInfoBranded;
    const account = mockWalletAccount({ symbol: ETH, tokens: [usdc, ens] });
    const sections: AccountListSection[] = [
        { type: 'account', account, hasAnyKnownTokens: true },
        { type: 'staking', account, stakingCryptoBalance: '0.5' },
        { type: 'token', account, token: usdc },
        { type: 'token', account, token: ens },
    ];
    const search = (query: string) =>
        sections
            .filter(section =>
                isAccountListSectionMatchingSearch({
                    section,
                    query: normalizeAssetSearchQuery(query),
                    nativeTokenName: 'Ethereum',
                }),
            )
            .map(section => (section.type === 'token' ? section.token.symbol : section.type));

    it('matches a token by its symbol, ignoring case and surrounding spaces', () => {
        expect(search('  usdc ')).toEqual(['USDC']);
    });

    it('matches a token by part of its contract address', () => {
        expect(search(USDC.slice(0, 8))).toEqual(['USDC']);
    });

    it('matches the coin and its stake by the coin symbol and by its name', () => {
        expect(search('eth')).toEqual(['account', 'staking']);
        expect(search('ethereum')).toEqual(['account', 'staking']);
    });

    it('matches a token held at zero as any other token', () => {
        expect(search('ens')).toEqual(['ENS']);
    });

    it('finds nothing for a query no asset matches', () => {
        expect(search('doge')).toEqual([]);
    });
});
