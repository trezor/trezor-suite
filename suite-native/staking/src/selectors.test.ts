import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type StakeDataState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    selectApy,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
} from './selectors';

const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');
const adaSymbol = asNetworkSymbol('ada');

const eth1Key = mockAccountKey({ symbol: ethSymbol, descriptor: 'eth1' });
const sol1Key = mockAccountKey({ symbol: solSymbol, descriptor: 'sol1' });
const etc1Key = mockAccountKey({ descriptor: 'etc1' });
const ada1Key = mockAccountKey({ symbol: adaSymbol, descriptor: 'ada1' });
const nonExistentKey = mockAccountKey({ descriptor: 'nonExistent' });

const ethAccountWithClaimableStake: Account = {
    symbol: 'eth',
    accountLabel: 'ETH Account #1',
    deviceState: 'device@state:1',
    key: eth1Key,
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
    key: sol1Key,
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
    key: etc1Key,
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
                                apy: 2.4,
                                saturation: 80.77,
                                id: 'pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn',
                            },
                            {
                                apy: 2.06,
                                saturation: 76.42,
                                id: 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj',
                            },
                            {
                                apy: 1.96,
                                saturation: 62.64,
                                id: 'pool13rt3ngkek4l876980ect869cu978d36dcyh22ts4nwuf7ncq02u',
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

            const result = selectClaimableAmountByAccountKey(testState as any, eth1Key);

            expect(result).toBe('0.5');
        });

        it('should return "0" for SOL account without claimable stake', () => {
            const testState = getTestState([solAccountWithStaking]);

            const result = selectClaimableAmountByAccountKey(testState as any, sol1Key);

            expect(result).toBe('0');
        });

        it('should return "0" for unsupported network', () => {
            const testState = getTestState([etcAccount]);

            const result = selectClaimableAmountByAccountKey(testState as any, etc1Key);

            expect(result).toBe('0');
        });

        it('should return "0" for non-existent account', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectClaimableAmountByAccountKey(testState as any, nonExistentKey);

            expect(result).toBe('0');
        });
    });

    describe('selectCanClaimByAccountKey', () => {
        it('should return true for ETH account with claimable stake', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectCanClaimByAccountKey(testState as any, eth1Key);

            expect(result).toBe(true);
        });

        it('should return false for SOL account without claimable stake', () => {
            const testState = getTestState([solAccountWithStaking]);

            const result = selectCanClaimByAccountKey(testState as any, sol1Key);

            expect(result).toBe(false);
        });

        it('should return false for unsupported network', () => {
            const testState = getTestState([etcAccount]);

            const result = selectCanClaimByAccountKey(testState as any, etc1Key);

            expect(result).toBe(false);
        });

        it('should return false for non-existent account', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectCanClaimByAccountKey(testState as any, nonExistentKey);

            expect(result).toBe(false);
        });
    });

    describe('selectApy', () => {
        it('should return ETH APY by accountKey', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectApy(testState as any, { accountKey: eth1Key });

            expect(result).toBe(3.08);
        });

        it('should return ETH APY by networkSymbol', () => {
            const testState = getTestState([]);

            const result = selectApy(testState as any, { networkSymbol: ethSymbol });

            expect(result).toBe(3.08);
        });

        it('should return SOL APY by accountKey', () => {
            const testState = getTestState([solAccountWithStaking]);

            const result = selectApy(testState as any, { accountKey: sol1Key });

            expect(result).toBe(6.24);
        });

        it('should return SOL APY by networkSymbol', () => {
            const testState = getTestState([]);

            const result = selectApy(testState as any, { networkSymbol: solSymbol });

            expect(result).toBe(6.24);
        });

        it('should return best pool APY for ADA by networkSymbol', () => {
            const testState = getTestState([]);

            const result = selectApy(testState as any, { networkSymbol: adaSymbol });

            expect(result).toBe(1.96);
        });

        it('should return matched pool APY for ADA account with known poolId', () => {
            const adaAccount = {
                symbol: 'ada',
                accountLabel: 'ADA Account #1',
                deviceState: 'device@state:1',
                key: ada1Key,
                visible: true,
                networkType: 'cardano',
                misc: {
                    staking: {
                        poolId: 'pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn',
                    },
                },
            } as unknown as Account;
            const testState = getTestState([adaAccount]);

            const result = selectApy(testState as any, { accountKey: ada1Key });

            expect(result).toBe(2.4);
        });

        it('should return null for ADA account staked outside known pools', () => {
            const adaAccount = {
                symbol: 'ada',
                accountLabel: 'ADA Account #1',
                deviceState: 'device@state:1',
                key: ada1Key,
                visible: true,
                networkType: 'cardano',
                misc: {
                    staking: {
                        poolId: 'unknown-pool-id',
                    },
                },
            } as unknown as Account;
            const testState = getTestState([adaAccount]);

            const result = selectApy(testState as any, { accountKey: ada1Key });

            expect(result).toBeNull();
        });

        it('should return null when neither accountKey nor networkSymbol is provided', () => {
            const testState = getTestState([]);

            const result = selectApy(testState as any, {});

            expect(result).toBeNull();
        });

        it('should return null for non-existent accountKey', () => {
            const testState = getTestState([ethAccountWithClaimableStake]);

            const result = selectApy(testState as any, {
                accountKey: nonExistentKey,
            });

            expect(result).toBeNull();
        });

        it('should return null for unsupported network', () => {
            const testState = getTestState([etcAccount]);

            const result = selectApy(testState as any, { accountKey: etc1Key });

            expect(result).toBeNull();
        });
    });

    // TODO: test
});
