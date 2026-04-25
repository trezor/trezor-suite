import { renderHook } from '@testing-library/react';

import { type Account } from '@suite-common/wallet-types';

import { useStakingAccountsVisibility } from '../useStakingAccountsVisibility';

const mockGetAccountTotalStakingBalance = jest.fn<string | null, [Account]>();

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAccountTotalStakingBalance: (...args: [Account]) =>
        mockGetAccountTotalStakingBalance(...args),
}));

const createMockAccount = (overrides: Partial<Account>): Account =>
    ({
        key: 'default-key',
        index: 0,
        symbol: 'eth',
        networkType: 'ethereum',
        accountType: 'normal',
        formattedBalance: '0',
        descriptor: '0x123',
        tokens: [],
        ...overrides,
    }) as Account;

const defaultProps = {
    currentRates: { eth: 2000, sol: 100, ada: 0.5, thod: 2000, dsol: 100 },
    ethNotActivated: false,
    solNotActivated: false,
    adaNotActivated: false,
};

describe('useStakingAccountsVisibility', () => {
    beforeEach(() => {
        mockGetAccountTotalStakingBalance.mockReturnValue(null);
    });

    describe('hasAnyRewardsData', () => {
        it('should be false when there are no staking accounts', () => {
            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [],
                }),
            );

            expect(result.current.hasAnyRewardsData).toBe(false);
        });

        it('should be false when all accounts have insufficient funds and no staking', () => {
            mockGetAccountTotalStakingBalance.mockReturnValue('0');

            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [
                        createMockAccount({
                            key: 'eth-0' as Account['key'],
                            symbol: 'eth',
                            formattedBalance: '0.01',
                        }),
                        createMockAccount({
                            key: 'sol-0' as Account['key'],
                            symbol: 'sol',
                            networkType: 'solana',
                            formattedBalance: '0.001',
                        }),
                    ],
                }),
            );

            expect(result.current.hasAnyRewardsData).toBe(false);
        });

        it('should be true when at least one account has sufficient funds to stake', () => {
            mockGetAccountTotalStakingBalance.mockReturnValue('0');

            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [
                        createMockAccount({
                            key: 'eth-0' as Account['key'],
                            symbol: 'eth',
                            formattedBalance: '0.01',
                        }),
                        createMockAccount({
                            key: 'eth-1' as Account['key'],
                            symbol: 'eth',
                            formattedBalance: '1.0',
                        }),
                    ],
                }),
            );

            expect(result.current.hasAnyRewardsData).toBe(true);
        });

        it('should be true when at least one account is actively staking', () => {
            mockGetAccountTotalStakingBalance.mockReturnValue('0.5');

            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [
                        createMockAccount({
                            key: 'eth-0' as Account['key'],
                            symbol: 'eth',
                            formattedBalance: '0',
                        }),
                    ],
                }),
            );

            expect(result.current.hasAnyRewardsData).toBe(true);
        });
    });
});
