import { type StakeDataState } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import {
    selectAPYBySymbol,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
} from '../selectors';

const ethAccountWithClaimableStake: Account = {
    symbol: 'eth',
    accountLabel: 'ETH Account #1',
    deviceState: 'device@state:1',
    key: 'eth1',
    visible: true,
    networkType: 'ethereum',
    misc: {
        stakingPools: [
            {
                name: 'Everstake',
                contract: '0x456',
                autocompoundBalance: '1000000000000000000',
                claimableAmount: '500000000000000000',
                depositedBalance: '2000000000000000000',
                pendingBalance: '0',
                pendingDepositedBalance: '0',
                restakedReward: '50000000000000000',
                withdrawTotalAmount: '500000000000000000',
            },
        ],
    },
} as unknown as Account;

const solAccountWithStaking: Account = {
    symbol: 'sol',
    accountLabel: 'SOL Account #1',
    deviceState: 'device@state:1',
    key: 'sol1',
    visible: true,
    networkType: 'solana',
    misc: {
        solStakingAccounts: [
            {
                status: 'active',
                stake: '1000000000',
                rentExemptReserve: '10',
            },
        ],
        solEpoch: 1,
    },
} as unknown as Account;

const etcAccount: Account = {
    symbol: 'etc',
    accountLabel: 'ETC Account #1',
    deviceState: 'device@state:1',
    key: 'etc1' as AccountKey, // Todo: create properly via `createAccountKey()`
    visible: true,
    networkType: 'ethereum',
} as unknown as Account;

const getTestState = (accounts: Account[]) => ({
    wallet: {
        accounts,
        devices: [
            {
                state: 'device@state:1',
                connected: true,
                available: true,
            },
        ],
        selectedDevice: {
            state: 'device@state:1',
        },
        stake: {
            data: {
                error: null,
                isLoading: false,
                lastSuccessAt: null,
                data: {
                    eth: {
                        stats: {
                            apy: 3.08,
                            nextRewardPayout: 5,
                        },
                        validators: {},
                    },
                    sol: {
                        stats: {
                            apy: 6.24,
                        },
                    },
                    ada: {
                        pools: [
                            {
                                apy: 2.43,
                                saturation: 81.09,
                                id: 'pool1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzqs6cy',
                            },
                            {
                                apy: 5.8,
                                saturation: 1.92,
                                id: 'pool13rt3ngkek4l876980ect869cu978d36dcyh22ts4nwuf7ncq02u',
                            },
                            {
                                apy: 2.43,
                                saturation: 0.05,
                                id: 'pool1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq2crtxv',
                            },
                        ],
                    },
                },
            } satisfies StakeDataState,
        },
        transactions: { transactions: {}, fetchStatusDetail: {} },
    },
});

describe('main staking selectors', () => {
    describe('selectClaimableAmountByAccountKey', () => {
        it('should return claimable amount for ETH account with claimable stake', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectClaimableAmountByAccountKey(
                testState as any,
                'eth1' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe('0.5');
        });

        it('should return "0" for SOL account without claimable stake', () => {
            const testState = getTestState([solAccountWithStaking]);

            const result = selectClaimableAmountByAccountKey(
                testState as any,
                'sol1' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe('0');
        });

        it('should return "0" for unsupported network', () => {
            const testState = getTestState([etcAccount]);

            const result = selectClaimableAmountByAccountKey(
                testState as any,
                'etc1' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe('0');
        });

        it('should return "0" for non-existent account', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectClaimableAmountByAccountKey(
                testState as any,
                'non-existent' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe('0');
        });
    });

    describe('selectCanClaimByAccountKey', () => {
        it('should return true for ETH account with claimable stake', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectCanClaimByAccountKey(
                testState as any,
                'eth1' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe(true);
        });

        it('should return false for SOL account without claimable stake', () => {
            const testState = getTestState([solAccountWithStaking]);

            const result = selectCanClaimByAccountKey(
                testState as any,
                'sol1' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe(false);
        });

        it('should return false for unsupported network', () => {
            const testState = getTestState([etcAccount]);

            const result = selectCanClaimByAccountKey(
                testState as any,
                'etc1' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe(false);
        });

        it('should return false for non-existent account', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectCanClaimByAccountKey(
                testState as any,
                'non-existent' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe(false);
        });
    });

    describe('selectApyBySymbol', () => {
        it('should return correct apy for eht', () => {
            const testState = getTestState([]);

            const result = selectAPYBySymbol(testState as any, 'eth');

            expect(result).toBe(3.08);
        });

        it('should return correct apy for sol', () => {
            const testState = getTestState([]);

            const result = selectAPYBySymbol(testState as any, 'sol');

            expect(result).toBe(6.24);
        });

        it('should return the highest apy for cardano', () => {
            const testState = getTestState([]);

            const result = selectAPYBySymbol(testState as any, 'ada');

            expect(result).toBe(5.8);
        });
    });

    // TODO: test
});
