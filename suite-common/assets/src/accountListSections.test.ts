import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { type TokenInfoBranded } from '@suite-common/tokens';
import { fiatRatesInitialState, initialWalletSettingsState } from '@suite-common/wallet-core';
import { mockStakeRootState } from '@suite-common/wallet-core/mocks';
import { type Account } from '@suite-common/wallet-types';
import { mockEthereumStakingAccount } from '@suite-common/wallet-types/mocks';

import {
    type AccountListSectionsRootState,
    getAccountListSections,
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
