import { renderHook } from '@testing-library/react';

import { type Account } from '@suite-common/wallet-types';

import { type YieldAccountOpportunity } from '../../types';
import { useYieldAccountsVisibility } from '../useYieldAccountsVisibility';

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

const createMockOpportunity = (
    account: Account,
    vaultId: string,
    hasRewardsData = false,
): YieldAccountOpportunity =>
    ({
        key: `${vaultId}:${account.key}`,
        account,
        networkSymbol: account.symbol,
        vault: { id: vaultId } as YieldAccountOpportunity['vault'],
        matchedInputToken: undefined,
        hasVaultPosition: false,
        hasRewardsData,
        suppliedAmount: '0',
        additionalSupplyAmount: '0',
        suppliedSymbol: 'usdc' as YieldAccountOpportunity['suppliedSymbol'],
        suppliedContractAddress: null,
        apyPercentage: 5,
    }) as YieldAccountOpportunity;

describe('useYieldAccountsVisibility', () => {
    describe('vault fallback selection', () => {
        it('should pick the lowest-index account as fallback when no opportunity has rewards data', () => {
            const eth2 = createMockAccount({
                key: 'eth-2' as Account['key'],
                index: 2,
            });
            const eth1 = createMockAccount({
                key: 'eth-1' as Account['key'],
                index: 1,
            });
            const eth0 = createMockAccount({
                key: 'eth-0' as Account['key'],
                index: 0,
            });

            const yieldAccountOpportunities = [
                createMockOpportunity(eth2, 'vault-a'),
                createMockOpportunity(eth1, 'vault-a'),
                createMockOpportunity(eth0, 'vault-a'),
            ];

            const { result } = renderHook(() =>
                useYieldAccountsVisibility({ yieldAccountOpportunities }),
            );

            expect(result.current.displayedYieldAccountOpportunities).toHaveLength(1);
            expect(result.current.displayedYieldAccountOpportunities[0].account?.key).toBe('eth-0');
            expect(result.current.hasHiddenYieldAccountOpportunities).toBe(true);
        });

        it('should pick the same account across all vaults on the same network', () => {
            const eth2 = createMockAccount({
                key: 'eth-2' as Account['key'],
                index: 2,
            });
            const eth0 = createMockAccount({
                key: 'eth-0' as Account['key'],
                index: 0,
            });

            const yieldAccountOpportunities = [
                createMockOpportunity(eth2, 'vault-a'),
                createMockOpportunity(eth0, 'vault-a'),
                createMockOpportunity(eth2, 'vault-b'),
                createMockOpportunity(eth0, 'vault-b'),
            ];

            const { result } = renderHook(() =>
                useYieldAccountsVisibility({ yieldAccountOpportunities }),
            );

            const fallbackKeys = result.current.displayedYieldAccountOpportunities.map(
                opportunity => opportunity.account?.key,
            );

            expect(fallbackKeys).toEqual(['eth-0', 'eth-0']);
        });

        it('should pick the lowest-index account when accounts have equal non-zero token balances', () => {
            const eth2 = createMockAccount({
                key: 'eth-2' as Account['key'],
                index: 2,
            });
            const eth1 = createMockAccount({
                key: 'eth-1' as Account['key'],
                index: 1,
            });
            const eth0 = createMockAccount({
                key: 'eth-0' as Account['key'],
                index: 0,
            });

            const equalAvailableBalance = '10';
            const yieldAccountOpportunities = [
                {
                    ...createMockOpportunity(eth2, 'vault-a'),
                    additionalSupplyAmount: equalAvailableBalance,
                },
                {
                    ...createMockOpportunity(eth1, 'vault-a'),
                    additionalSupplyAmount: equalAvailableBalance,
                },
                {
                    ...createMockOpportunity(eth0, 'vault-a'),
                    additionalSupplyAmount: equalAvailableBalance,
                },
            ];

            const { result } = renderHook(() =>
                useYieldAccountsVisibility({ yieldAccountOpportunities }),
            );

            expect(result.current.displayedYieldAccountOpportunities).toHaveLength(1);
            expect(result.current.displayedYieldAccountOpportunities[0].account?.key).toBe('eth-0');
        });

        it('should prefer normal accountType over ledger when balances are equal but non-zero', () => {
            const baseLedger0 = createMockAccount({
                key: 'base-ledger-0' as Account['key'],
                symbol: 'base',
                networkType: 'ethereum',
                accountType: 'ledger',
                index: 0,
            });
            const baseNormal3 = createMockAccount({
                key: 'base-normal-3' as Account['key'],
                symbol: 'base',
                networkType: 'ethereum',
                accountType: 'normal',
                index: 3,
            });

            const equalAvailableBalance = '10';
            const yieldAccountOpportunities = [
                {
                    ...createMockOpportunity(baseLedger0, 'vault-a'),
                    additionalSupplyAmount: equalAvailableBalance,
                },
                {
                    ...createMockOpportunity(baseNormal3, 'vault-a'),
                    additionalSupplyAmount: equalAvailableBalance,
                },
            ];

            const { result } = renderHook(() =>
                useYieldAccountsVisibility({ yieldAccountOpportunities }),
            );

            expect(result.current.displayedYieldAccountOpportunities).toHaveLength(1);
            expect(result.current.displayedYieldAccountOpportunities[0].account?.key).toBe(
                'base-normal-3',
            );
        });

        it('should prefer normal accountType over ledger even when index is higher', () => {
            const baseLedger0 = createMockAccount({
                key: 'base-ledger-0' as Account['key'],
                symbol: 'base',
                networkType: 'ethereum',
                accountType: 'ledger',
                index: 0,
            });
            const baseNormal5 = createMockAccount({
                key: 'base-normal-5' as Account['key'],
                symbol: 'base',
                networkType: 'ethereum',
                accountType: 'normal',
                index: 5,
            });

            const yieldAccountOpportunities = [
                createMockOpportunity(baseLedger0, 'vault-a'),
                createMockOpportunity(baseNormal5, 'vault-a'),
            ];

            const { result } = renderHook(() =>
                useYieldAccountsVisibility({ yieldAccountOpportunities }),
            );

            expect(result.current.displayedYieldAccountOpportunities).toHaveLength(1);
            expect(result.current.displayedYieldAccountOpportunities[0].account?.key).toBe(
                'base-normal-5',
            );
        });

        it('should keep the opportunity with rewards data and not add a fallback for that vault', () => {
            const eth2 = createMockAccount({
                key: 'eth-2' as Account['key'],
                index: 2,
            });
            const eth0 = createMockAccount({
                key: 'eth-0' as Account['key'],
                index: 0,
            });

            const yieldAccountOpportunities = [
                createMockOpportunity(eth2, 'vault-a', true),
                createMockOpportunity(eth0, 'vault-a'),
            ];

            const { result } = renderHook(() =>
                useYieldAccountsVisibility({ yieldAccountOpportunities }),
            );

            expect(result.current.displayedYieldAccountOpportunities).toHaveLength(1);
            expect(result.current.displayedYieldAccountOpportunities[0].account?.key).toBe('eth-2');
        });
    });
});
