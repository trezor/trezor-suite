import { act, renderHook } from '@testing-library/react';

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

    describe('insufficient funds fallback', () => {
        it('should pick the lowest-index account per network when no account has rewards data', () => {
            mockGetAccountTotalStakingBalance.mockReturnValue('0');

            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [
                        createMockAccount({
                            key: 'eth-2' as Account['key'],
                            symbol: 'eth',
                            index: 2,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'eth-1' as Account['key'],
                            symbol: 'eth',
                            index: 1,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'eth-0' as Account['key'],
                            symbol: 'eth',
                            index: 0,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'sol-3' as Account['key'],
                            symbol: 'sol',
                            networkType: 'solana',
                            index: 3,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'sol-0' as Account['key'],
                            symbol: 'sol',
                            networkType: 'solana',
                            index: 0,
                            formattedBalance: '0',
                        }),
                    ],
                }),
            );

            const ethFallback = result.current.displayedAccounts.find(
                account => account.symbol === 'eth',
            );
            const solFallback = result.current.displayedAccounts.find(
                account => account.symbol === 'sol',
            );

            expect(ethFallback?.key).toBe('eth-0');
            expect(solFallback?.key).toBe('sol-0');
        });

        it('should still pick the lowest-index account when input order is reversed by network', () => {
            mockGetAccountTotalStakingBalance.mockReturnValue('0');

            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [
                        createMockAccount({
                            key: 'ada-5' as Account['key'],
                            symbol: 'ada',
                            networkType: 'cardano',
                            index: 5,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'ada-1' as Account['key'],
                            symbol: 'ada',
                            networkType: 'cardano',
                            index: 1,
                            formattedBalance: '0',
                        }),
                    ],
                }),
            );

            const adaFallback = result.current.displayedAccounts.find(
                account => account.symbol === 'ada',
            );

            expect(adaFallback?.key).toBe('ada-1');
        });

        it('should pick the lowest-index account when insufficient balances are equal but non-zero', () => {
            mockGetAccountTotalStakingBalance.mockReturnValue('0');

            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [
                        createMockAccount({
                            key: 'eth-2' as Account['key'],
                            symbol: 'eth',
                            index: 2,
                            formattedBalance: '0.005',
                        }),
                        createMockAccount({
                            key: 'eth-1' as Account['key'],
                            symbol: 'eth',
                            index: 1,
                            formattedBalance: '0.005',
                        }),
                        createMockAccount({
                            key: 'eth-0' as Account['key'],
                            symbol: 'eth',
                            index: 0,
                            formattedBalance: '0.005',
                        }),
                    ],
                }),
            );

            const ethFallback = result.current.displayedAccounts.find(
                account => account.symbol === 'eth',
            );

            expect(ethFallback?.key).toBe('eth-0');
        });

        it('should prefer normal accountType over legacy when balances are equal but non-zero', () => {
            mockGetAccountTotalStakingBalance.mockReturnValue('0');

            const equalBalance = '0.5';
            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [
                        createMockAccount({
                            key: 'ada-legacy-0' as Account['key'],
                            symbol: 'ada',
                            networkType: 'cardano',
                            accountType: 'legacy',
                            index: 0,
                            formattedBalance: equalBalance,
                        }),
                        createMockAccount({
                            key: 'ada-normal-3' as Account['key'],
                            symbol: 'ada',
                            networkType: 'cardano',
                            accountType: 'normal',
                            index: 3,
                            formattedBalance: equalBalance,
                        }),
                        createMockAccount({
                            key: 'ada-ledger-1' as Account['key'],
                            symbol: 'ada',
                            networkType: 'cardano',
                            accountType: 'ledger',
                            index: 1,
                            formattedBalance: equalBalance,
                        }),
                    ],
                }),
            );

            const adaFallback = result.current.displayedAccounts.find(
                account => account.symbol === 'ada',
            );

            expect(adaFallback?.key).toBe('ada-normal-3');
        });

        it('should group insufficient-funds accounts by network and sort them by index in expanded view', () => {
            mockGetAccountTotalStakingBalance.mockReturnValue('0');

            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [
                        createMockAccount({
                            key: 'eth-8' as Account['key'],
                            symbol: 'eth',
                            index: 8,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'eth-7' as Account['key'],
                            symbol: 'eth',
                            index: 7,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'sol-1' as Account['key'],
                            symbol: 'sol',
                            networkType: 'solana',
                            index: 1,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'eth-9' as Account['key'],
                            symbol: 'eth',
                            index: 9,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'ada-0' as Account['key'],
                            symbol: 'ada',
                            networkType: 'cardano',
                            index: 0,
                            formattedBalance: '0',
                        }),
                    ],
                }),
            );

            act(() => {
                result.current.toggleExpanded();
            });

            const orderedKeys = result.current.displayedAccounts.map(account => account.key);

            expect(orderedKeys).toEqual(['eth-7', 'eth-8', 'eth-9', 'sol-1', 'ada-0']);
        });

        it('should prefer normal accountType over legacy/ledger even when index is higher', () => {
            mockGetAccountTotalStakingBalance.mockReturnValue('0');

            const { result } = renderHook(() =>
                useStakingAccountsVisibility({
                    ...defaultProps,
                    stakingAccounts: [
                        createMockAccount({
                            key: 'ada-ledger-0' as Account['key'],
                            symbol: 'ada',
                            networkType: 'cardano',
                            accountType: 'ledger',
                            index: 0,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'ada-legacy-0' as Account['key'],
                            symbol: 'ada',
                            networkType: 'cardano',
                            accountType: 'legacy',
                            index: 0,
                            formattedBalance: '0',
                        }),
                        createMockAccount({
                            key: 'ada-normal-5' as Account['key'],
                            symbol: 'ada',
                            networkType: 'cardano',
                            accountType: 'normal',
                            index: 5,
                            formattedBalance: '0',
                        }),
                    ],
                }),
            );

            const adaFallback = result.current.displayedAccounts.find(
                account => account.symbol === 'ada',
            );

            expect(adaFallback?.key).toBe('ada-normal-5');
        });
    });
});
