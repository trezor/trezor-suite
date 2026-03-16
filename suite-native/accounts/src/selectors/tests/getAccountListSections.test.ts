import { Account, TokenInfoBranded } from '@suite-common/wallet-types';

import { getAccountListSections } from '../getAccountListSections';

let mockStakingBalance = '0';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAccountTotalStakingBalance: (_: Account) => mockStakingBalance,
}));

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

        // Should have section title, account section, and two token sections (for Token1 and Token3)
        expect(sections).toHaveLength(4);

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

        // Should only have section title and account section
        expect(sections).toHaveLength(2);
        expect(sections[0].type).toBe('sectionTitle');
        expect(sections[1].type).toBe('account');
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

        // Should only have section title and account section
        expect(sections).toHaveLength(2);
        expect(sections[0].type).toBe('sectionTitle');
        expect(sections[1].type).toBe('account');
    });

    it('should handle account with staking balance', () => {
        mockStakingBalance = '100';

        const sections = getAccountListSections(mockAccount, mockTokenDefinitions);

        // Should have section title, account section, staking section, and two token sections
        expect(sections).toHaveLength(5);
        expect(sections[0].type).toBe('sectionTitle');
        expect(sections[1].type).toBe('account');
        expect(sections[2].type).toBe('staking');
        expect(sections[3].type).toBe('token');
        expect(sections[4].type).toBe('token');
    });
});
