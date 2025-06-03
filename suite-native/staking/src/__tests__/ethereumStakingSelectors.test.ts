import { TrezorDevice } from '@suite-common/suite-types';
import { Account } from '@suite-common/wallet-types';

import {
    selectEthereumAccountHasStaking,
    selectEthereumCanClaimByAccountKey,
    selectEthereumClaimableAmountByAccountKey,
    selectEthereumIsStakePendingByAccountKey,
    selectEthereumRewardsBalanceByAccountKey,
    selectEthereumStakedBalanceByAccountKey,
    selectEthereumStakingPoolByAccountKey,
    selectEthereumTotalStakePendingByAccountKey,
} from '../ethereumStakingSelectors';

const staticStateString = 'device@state:1';

const ethAccountWithStaking: Account = {
    symbol: 'eth',
    accountLabel: 'ETH Account #1',
    deviceState: staticStateString,
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
                pendingBalance: '100000000000000000',
                pendingDepositedBalance: '0',
                restakedReward: '50000000000000000',
                withdrawTotalAmount: '500000000000000000',
            },
        ],
    },
} as unknown as Account;

const ethAccountWithoutStaking: Account = {
    symbol: 'eth',
    accountLabel: 'ETH Account #2',
    deviceState: staticStateString,
    key: 'eth2',
    visible: true,
    networkType: 'ethereum',
} as unknown as Account;

const ethAccountWithPendingStake: Account = {
    symbol: 'eth',
    accountLabel: 'ETH Account #3',
    deviceState: staticStateString,
    key: 'eth3',
    visible: true,
    networkType: 'ethereum',
    misc: {
        stakingPools: [
            {
                name: 'Everstake',
                contract: '0xabc',
                autocompoundBalance: '0',
                claimableAmount: '0',
                depositedBalance: '0',
                pendingBalance: '1000000000000000000',
                pendingDepositedBalance: '0',
                restakedReward: '0',
                withdrawTotalAmount: '0',
            },
        ],
    },
} as unknown as Account;

const getTestState = (accounts: Account[]) => ({
    wallet: {
        accounts,
        transactions: { transactions: {}, fetchStatusDetail: {} },
    },
    device: {
        devices: [
            {
                state: {
                    sessionId: '1',
                    staticSessionId: staticStateString,
                },
            } as TrezorDevice,
        ],
        selectedDevice: {
            state: {
                sessionId: '1',
                staticSessionId: staticStateString,
            },
        } as TrezorDevice,
    },
});

describe('ethereumStakingSelectors', () => {
    describe('selectEthereumStakingPoolByAccountKey', () => {
        it('should return staking pool for account with staking', () => {
            const testState = getTestState([ethAccountWithStaking]);

            const result = selectEthereumStakingPoolByAccountKey(testState as any, 'eth1');

            expect(result).toEqual({
                name: 'Everstake',
                contract: '0x456',
                autocompoundBalance: '1',
                claimableAmount: '0.5',
                depositedBalance: '2',
                pendingBalance: '0.1',
                pendingDepositedBalance: '0',
                restakedReward: '0.05',
                withdrawTotalAmount: '0.5',
                totalPendingStakeBalance: '0.1',
                canClaim: true,
            });
        });

        it('should return undefined for account without staking', () => {
            const testState = getTestState([ethAccountWithoutStaking]);

            const result = selectEthereumStakingPoolByAccountKey(testState as any, 'eth2');

            expect(result).toBeUndefined();
        });

        it('should return null for non-existent account', () => {
            const testState = getTestState([ethAccountWithStaking]);

            const result = selectEthereumStakingPoolByAccountKey(testState as any, 'non-existent');

            expect(result).toBeNull();
        });
    });

    describe('selectEthereumAccountHasStaking', () => {
        it('should return true for account with staking', () => {
            const testState = getTestState([ethAccountWithStaking]);

            const result = selectEthereumAccountHasStaking(testState as any, 'eth1');

            expect(result).toBe(true);
        });

        it('should return false for account without staking', () => {
            const testState = getTestState([ethAccountWithoutStaking]);

            const result = selectEthereumAccountHasStaking(testState as any, 'eth2');

            expect(result).toBe(false);
        });
    });

    describe('selectEthereumIsStakePendingByAccountKey', () => {
        it('should return true for account with pending stake', () => {
            const testState = getTestState([ethAccountWithPendingStake]);

            const result = selectEthereumIsStakePendingByAccountKey(testState as any, 'eth3');

            expect(result).toBe(true);
        });

        it('should return false for account without pending stake', () => {
            const testState = getTestState([ethAccountWithStaking]);

            const result = selectEthereumIsStakePendingByAccountKey(testState as any, 'eth1');

            expect(result).toBe(true);
        });

        it('should return false for account without staking', () => {
            const testState = getTestState([ethAccountWithoutStaking]);

            const result = selectEthereumIsStakePendingByAccountKey(testState as any, 'eth2');

            expect(result).toBe(false);
        });
    });

    describe('selectEthereumStakedBalanceByAccountKey', () => {
        it('should return staked balance for account with staking', () => {
            const testState = getTestState([ethAccountWithStaking]);

            const result = selectEthereumStakedBalanceByAccountKey(testState as any, 'eth1');

            expect(result).toBe('2');
        });

        it('should return "0" for account without staking', () => {
            const testState = getTestState([ethAccountWithoutStaking]);

            const result = selectEthereumStakedBalanceByAccountKey(testState as any, 'eth2');

            expect(result).toBe('0');
        });
    });

    describe('selectEthereumRewardsBalanceByAccountKey', () => {
        it('should return rewards balance for account with staking', () => {
            const testState = getTestState([ethAccountWithStaking]);

            const result = selectEthereumRewardsBalanceByAccountKey(testState as any, 'eth1');

            expect(result).toBe('0.05');
        });

        it('should return "0" for account without staking', () => {
            const testState = getTestState([ethAccountWithoutStaking]);

            const result = selectEthereumRewardsBalanceByAccountKey(testState as any, 'eth2');

            expect(result).toBe('0');
        });
    });

    describe('selectEthereumTotalStakePendingByAccountKey', () => {
        it('should return pending stake balance for account with pending stake', () => {
            const testState = getTestState([ethAccountWithPendingStake]);

            const result = selectEthereumTotalStakePendingByAccountKey(testState as any, 'eth3');

            expect(result).toBe('1');
        });

        it('should return "0" for account without staking', () => {
            const testState = getTestState([ethAccountWithoutStaking]);

            const result = selectEthereumTotalStakePendingByAccountKey(testState as any, 'eth2');

            expect(result).toBe('0');
        });
    });

    describe('selectEthereumClaimableAmountByAccountKey', () => {
        it('should return claimable amount for account with claimable stake', () => {
            const testState = getTestState([ethAccountWithStaking]);

            const result = selectEthereumClaimableAmountByAccountKey(testState as any, 'eth1');

            expect(result).toBe('0.5');
        });

        it('should return "0" for account without claimable stake', () => {
            const testState = getTestState([ethAccountWithPendingStake]);

            const result = selectEthereumClaimableAmountByAccountKey(testState as any, 'eth3');

            expect(result).toBe('0');
        });

        it('should return "0" for account without staking', () => {
            const testState = getTestState([ethAccountWithoutStaking]);

            const result = selectEthereumClaimableAmountByAccountKey(testState as any, 'eth2');

            expect(result).toBe('0');
        });
    });

    describe('selectEthereumCanClaimByAccountKey', () => {
        it('should return true for account with claimable stake', () => {
            const testState = getTestState([ethAccountWithStaking]);

            const result = selectEthereumCanClaimByAccountKey(testState as any, 'eth1');

            expect(result).toBe(true);
        });

        it('should return false for account without claimable stake', () => {
            const testState = getTestState([ethAccountWithPendingStake]);

            const result = selectEthereumCanClaimByAccountKey(testState as any, 'eth3');

            expect(result).toBe(false);
        });

        it('should return false for account without staking', () => {
            const testState = getTestState([ethAccountWithoutStaking]);

            const result = selectEthereumCanClaimByAccountKey(testState as any, 'eth2');

            expect(result).toBe(false);
        });
    });
});
