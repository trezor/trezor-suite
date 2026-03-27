import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type StakeState, stakeInitialState } from '@suite-common/wallet-core';
import { type Account, type AccountKey, type Timestamp } from '@suite-common/wallet-types';

import {
    selectExpectedRewardsForEpoch,
    selectSolStakingAccountsInfoByAccountKey,
    selectSolanaAPYByAccountKey,
    selectSolanaCanClaimByAccountKey,
    selectSolanaClaimableAmountByAccountKey,
    selectSolanaIsStakePendingByAccountKey,
    selectSolanaStakedBalanceByAccountKey,
    selectSolanaTotalStakePendingByAccountKey,
    selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol,
} from '../solanaStakingSelectors';
import { type NativeStakingRootState } from '../types';

type SolStakeData = NonNullable<StakeState['data']['sol']>;

const staticStateString = 'device@state:1';

const solAccountWithStaking: Account = {
    symbol: 'sol',
    accountLabel: 'SOL Account #1',
    deviceState: staticStateString,
    addresses: undefined,
    key: 'sol1',
    visible: true,
    networkType: 'solana',
    misc: {
        solStakingAccounts: [
            {
                status: 'active',
                stake: BigInt('1000000000'),
                rentExemptReserve: BigInt('10'),
            },
        ],
        solEpoch: 1,
    },
} as unknown as Account;

const solAccountNoStaking: Account = {
    symbol: 'sol',
    accountLabel: 'SOL Account #2',
    deviceState: staticStateString,
    addresses: undefined,
    key: 'sol2',
    visible: true,
    networkType: 'solana',
    misc: undefined,
} as unknown as Account;

const solAccountWithActivatingStaking: Account = {
    symbol: 'sol',
    accountLabel: 'SOL Account #3',
    deviceState: staticStateString,
    addresses: undefined,
    key: 'sol3',
    visible: true,
    networkType: 'solana',
    misc: {
        solStakingAccounts: [
            {
                status: 'activating',
                stake: BigInt('2000000000'),
                rentExemptReserve: BigInt('20'),
            },
        ],
        solEpoch: 2,
    },
} as unknown as Account;

const solAccountWithDeactivatedStaking: Account = {
    symbol: 'sol',
    accountLabel: 'SOL Account #4',
    deviceState: staticStateString,
    addresses: undefined,
    key: 'sol4',
    visible: true,
    networkType: 'solana',
    misc: {
        solStakingAccounts: [
            {
                status: 'deactivated',
                stake: BigInt('3000000000'),
                rentExemptReserve: BigInt('30'),
            },
        ],
        solEpoch: 3,
    },
} as unknown as Account;

const etcAccount: Account = {
    symbol: 'etc',
    accountLabel: 'ETC Account #1',
    deviceState: staticStateString,
    addresses: undefined,
    key: 'etc1',
    visible: true,
    networkType: 'ethereum',
} as unknown as Account;

const solStakeData: SolStakeData = {
    stakingInfo: {
        error: false,
        isLoading: true,
        lastSuccessfulFetchTimestamp: 0 as Timestamp,
        data: {
            apy: 6.21,
        },
    },
};

const messageSystemState = {
    config: null,
    currentSequence: 0,
    timestamp: 0,
    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: [],
    },
    dismissedMessages: {},
    validExperiments: [],
    configSource: 'remote' as const,
    manuallyAddedMessageIds: {},
    manuallyAddedExperimentIds: {},
};

const getTestState = ({
    accounts,
    withSolStakeData = false,
}: {
    accounts: Account[];
    withSolStakeData?: boolean;
}): NativeStakingRootState => ({
    wallet: {
        accounts,
        stake: { ...stakeInitialState, data: { sol: withSolStakeData ? solStakeData : {} } },
        transactions: { transactions: {}, phishing: {}, fetchStatusDetail: {} },
    },
    suiteSync: initialSuiteSyncState,
    suiteSyncData: initialSuiteSyncDataState,
    messageSystem: messageSystemState,
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
        persistentDeviceData: [],
    },
    appSettings: {
        isOnboardingFinished: false,
        isDeviceAuthenticityCheckEnabled: false,
        isFirmwareRevisionCheckEnabled: false,
        isFirmwareHashCheckEnabled: false,
        areTestnetsEnabled: false,
        shouldShowAutoEjectAlert: false,
        hasAutoEjectAlertBeenDisplayed: false,
        isTronEnabled: false,
    },
});

describe('selectors', () => {
    describe('selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol', () => {
        it('should have no staking', () => {
            const testState = getTestState({
                accounts: [solAccountNoStaking, etcAccount],
            });

            expect(
                selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(
                    {
                        ...testState,
                    },
                    'sol',
                ),
            ).toEqual([]);
        });

        it('should have staking', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountNoStaking, etcAccount],
            });

            expect(
                selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(
                    {
                        ...testState,
                    },
                    'sol',
                ),
            ).toEqual([solAccountWithStaking]);
        });
    });

    describe('selectSolStakingAccountsInfoByAccountKey', () => {
        it('should have active stake balance ', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountWithActivatingStaking],
            });

            expect(
                selectSolStakingAccountsInfoByAccountKey(
                    {
                        ...testState,
                    },
                    'sol1' as AccountKey, // Todo: create properly via `createAccountKey()`,
                )?.solStakedBalance,
            ).toEqual('1');
        });

        it('should have null stake info', () => {
            const testState = getTestState({
                accounts: [solAccountWithActivatingStaking, solAccountNoStaking, etcAccount],
            });

            expect(
                selectSolStakingAccountsInfoByAccountKey(
                    {
                        ...testState,
                    },
                    'sol1' as AccountKey, // Todo: create properly via `createAccountKey()`F
                ),
            ).toBeNull();
        });

        it('should have activating stake balance', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountWithActivatingStaking],
            });

            expect(
                selectSolStakingAccountsInfoByAccountKey(
                    {
                        ...testState,
                    },
                    'sol3' as AccountKey, // Todo: create properly via `createAccountKey()`
                )?.solPendingStakeBalance,
            ).toEqual('2');
        });
    });

    describe('selectSolanaIsStakePendingByAccountKey', () => {
        it('should have pending stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountWithActivatingStaking],
            });

            expect(
                selectSolanaIsStakePendingByAccountKey(
                    {
                        ...testState,
                    },
                    'sol3' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual(true);
        });

        it('should have no pending', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountNoStaking, etcAccount],
            });

            expect(
                selectSolanaIsStakePendingByAccountKey(
                    {
                        ...testState,
                    },
                    'sol3' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual(false);
        });
    });

    describe('selectSolanaAPYByAccountKey', () => {
        it('should have apy', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountWithActivatingStaking],
                withSolStakeData: true,
            });

            expect(
                selectSolanaAPYByAccountKey(
                    {
                        ...testState,
                    },
                    'sol3' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual(6.21);
        });

        it('should have no apy', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountNoStaking, etcAccount],
            });

            expect(
                selectSolanaAPYByAccountKey(
                    {
                        ...testState,
                    },
                    'sol3' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual(0);
        });
    });

    describe('selectSolanaStakedBalanceByAccountKey', () => {
        it('should return correct staked balance', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            expect(
                selectSolanaStakedBalanceByAccountKey(
                    {
                        ...testState,
                    },
                    'sol1' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual('1');
        });

        it('should return "0" for non-existent account', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            expect(
                selectSolanaStakedBalanceByAccountKey(
                    {
                        ...testState,
                    },
                    'non-existent-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual('0');
        });
    });

    describe('selectExpectedRewardsForEpoch', () => {
        it('should return correct expected rewards', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
                withSolStakeData: true,
            });

            expect(
                selectExpectedRewardsForEpoch(
                    {
                        ...testState,
                    },
                    'sol1' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual('0.000340274');
        });

        it('should return "0" for account without activated or deactivating stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithActivatingStaking],
                withSolStakeData: true,
            });

            expect(
                selectExpectedRewardsForEpoch(
                    {
                        ...testState,
                    },
                    'sol3' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual('0.000000000');
        });

        it('should return "0" for non-existent account', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            expect(
                selectExpectedRewardsForEpoch(
                    {
                        ...testState,
                    },
                    'non-existent-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual('0');
        });
    });

    describe('selectSolanaTotalStakePendingByAccountKey', () => {
        it('should return correct staked balance', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountWithActivatingStaking],
            });

            expect(
                selectSolanaTotalStakePendingByAccountKey(
                    {
                        ...testState,
                    },
                    'sol3' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual('2');
        });

        it('should return "0" for non-existent account', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountWithActivatingStaking],
            });

            expect(
                selectSolanaTotalStakePendingByAccountKey(
                    {
                        ...testState,
                    },
                    'non-existent-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual('0');
        });

        it('should return "0" for account without activating stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountWithActivatingStaking],
            });

            expect(
                selectSolanaTotalStakePendingByAccountKey(
                    {
                        ...testState,
                    },
                    'sol1' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            ).toEqual('0');
        });
    });

    describe('selectSolanaClaimableAmountByAccountKey', () => {
        it('should return "0" for account without claimable stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            const result = selectSolanaClaimableAmountByAccountKey(
                testState as any,
                'sol1' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe('0');
        });

        it('should return claimable balance for account with deactivated stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithDeactivatedStaking],
            });

            const result = selectSolanaClaimableAmountByAccountKey(
                testState as any,
                'sol4' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe('3');
        });

        it('should return "0" for account without staking', () => {
            const testState = getTestState({
                accounts: [solAccountNoStaking],
            });

            const result = selectSolanaClaimableAmountByAccountKey(
                testState as any,
                'sol2' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe('0');
        });

        it('should return "0" for non-existent account', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            const result = selectSolanaClaimableAmountByAccountKey(
                testState,
                'non-existent' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe('0');
        });
    });

    describe('selectSolanaCanClaimByAccountKey', () => {
        it('should return false for account without claimable stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            const result = selectSolanaCanClaimByAccountKey(
                testState as any,
                'sol1' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe(false);
        });

        it('should return true for account with deactivated stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithDeactivatedStaking],
            });

            const result = selectSolanaCanClaimByAccountKey(
                testState as any,
                'sol4' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe(true);
        });

        it('should return false for account without staking', () => {
            const testState = getTestState({
                accounts: [solAccountNoStaking],
            });

            const result = selectSolanaCanClaimByAccountKey(
                testState as any,
                'sol2' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe(false);
        });

        it('should return false for non-existent account', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            const result = selectSolanaCanClaimByAccountKey(
                testState as any,
                'non-existent' as AccountKey, // Todo: create properly via `createAccountKey()`
            );

            expect(result).toBe(false);
        });
    });
});
