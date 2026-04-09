import { type StakeDataState } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import {
    selectApy,
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

    describe('selectApy', () => {
        it('should return ETH APY by accountKey', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectApy(testState as any, { accountKey: 'eth1' as AccountKey });

            expect(result).toBe(3.08);
        });

        it('should return ETH APY by networkSymbol', () => {
            const testState = getTestState([]);

            const result = selectApy(testState as any, { networkSymbol: 'eth' });

            expect(result).toBe(3.08);
        });

        it('should return SOL APY by accountKey', () => {
            const testState = getTestState([solAccountWithStaking]);

            const result = selectApy(testState as any, { accountKey: 'sol1' as AccountKey });

            expect(result).toBe(6.24);
        });

        it('should return SOL APY by networkSymbol', () => {
            const testState = getTestState([]);

            const result = selectApy(testState as any, { networkSymbol: 'sol' });

            expect(result).toBe(6.24);
        });

        it('should return best pool APY for ADA by networkSymbol', () => {
            const testState = getTestState([]);

            const result = selectApy(testState as any, { networkSymbol: 'ada' });

            expect(result).toBe(5.8);
        });

        it('should return matched pool APY for ADA account with known poolId', () => {
            const adaAccount = {
                symbol: 'ada',
                accountLabel: 'ADA Account #1',
                deviceState: 'device@state:1',
                key: 'ada1',
                visible: true,
                networkType: 'cardano',
                misc: {
                    staking: {
                        poolId: 'pool1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzqs6cy',
                    },
                },
            } as unknown as Account;
            const testState = getTestState([adaAccount]);

            const result = selectApy(testState as any, { accountKey: 'ada1' as AccountKey });

            expect(result).toBe(2.43);
        });

        it('should return best pool APY for ADA account with unrecognized poolId', () => {
            const adaAccount = {
                symbol: 'ada',
                accountLabel: 'ADA Account #1',
                deviceState: 'device@state:1',
                key: 'ada1',
                visible: true,
                networkType: 'cardano',
                misc: {
                    staking: {
                        poolId: 'unknown-pool-id',
                    },
                },
            } as unknown as Account;
            const testState = getTestState([adaAccount]);

            const result = selectApy(testState as any, { accountKey: 'ada1' as AccountKey });

            expect(result).toBe(5.8);
        });

        it('should return null when neither accountKey nor networkSymbol is provided', () => {
            const testState = getTestState([]);

            const result = selectApy(testState as any, {});

            expect(result).toBeNull();
        });

        it('should return null for non-existent accountKey', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectApy(testState as any, {
                accountKey: 'non-existent' as AccountKey,
            });

            expect(result).toBeNull();
        });

        it('should return null for unsupported network', () => {
            const testState = getTestState([etcAccount]);

            const result = selectApy(testState as any, { accountKey: 'etc1' as AccountKey });

            expect(result).toBeNull();
        });
    });

    // TODO: test
});
