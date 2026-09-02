import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { type TrezorDevice } from '@suite-common/suite-types';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type StakeState, stakeInitialState } from '@suite-common/wallet-core';
import { type Account, type Timestamp } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';

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
} from './solanaStakingSelectors';
import { type NativeStakingRootState } from './types';

const staticStateString: StaticSessionId = 'device@state:1';
const solSymbol = asNetworkSymbol('sol');

const sol1Key = mockAccountKey({ symbol: solSymbol, descriptor: 'sol1' });
const sol2Key = mockAccountKey({ symbol: solSymbol, descriptor: 'sol2' });
const sol3Key = mockAccountKey({ symbol: solSymbol, descriptor: 'sol3' });
const sol4Key = mockAccountKey({ symbol: solSymbol, descriptor: 'sol4' });
const sol5Key = mockAccountKey({ symbol: solSymbol, descriptor: 'sol5' });
const etc1Key = mockAccountKey({ descriptor: 'etc1' });
const nonExistentKey = mockAccountKey({ descriptor: 'nonExistentKey' });
const nonExistentKey2 = mockAccountKey({ descriptor: 'nonExistent' });

const solAccountWithStaking: Account = {
    symbol: 'sol',
    accountLabel: 'SOL Account #1',
    deviceState: staticStateString,
    addresses: undefined,
    key: sol1Key,
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
    key: sol2Key,
    visible: true,
    networkType: 'solana',
    misc: undefined,
} as unknown as Account;

const solAccountWithActivatingStaking: Account = {
    symbol: 'sol',
    accountLabel: 'SOL Account #3',
    deviceState: staticStateString,
    addresses: undefined,
    key: sol3Key,
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

const solAccountWithActiveAndDeactivatingStaking: Account = {
    symbol: 'sol',
    accountLabel: 'SOL Account #5',
    deviceState: staticStateString,
    addresses: undefined,
    key: sol5Key,
    visible: true,
    networkType: 'solana',
    misc: {
        solStakingAccounts: [
            {
                status: 'active',
                stake: BigInt('1000000000'),
                rentExemptReserve: BigInt('10'),
            },
            {
                status: 'deactivating',
                stake: BigInt('2000000000'),
                rentExemptReserve: BigInt('20'),
            },
        ],
        solEpoch: 5,
    },
} as unknown as Account;

const solAccountWithDeactivatedStaking: Account = {
    symbol: 'sol',
    accountLabel: 'SOL Account #4',
    deviceState: staticStateString,
    addresses: undefined,
    key: sol4Key,
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
    key: etc1Key,
    visible: true,
    networkType: 'ethereum',
} as unknown as Account;

const solStakeData: StakeState['data'] = {
    error: null,
    isLoading: true,
    lastSuccessAt: 0 as Timestamp,
    data: {
        sol: {
            stats: {
                apy: 6.21,
            },
        },
        eth: undefined,
        ada: undefined,
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
        stake: {
            ...stakeInitialState,
            data: withSolStakeData
                ? solStakeData
                : {
                      error: null,
                      isLoading: false,
                      lastSuccessAt: null,
                      data: {
                          sol: undefined,
                          eth: undefined,
                          ada: undefined,
                      },
                  },
        },
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
        areDeviceMetaChecksEnabled: false,
        areTestnetsEnabled: false,
        shouldShowAutoEjectAlert: false,
        hasAutoEjectAlertBeenDisplayed: false,
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
                    solSymbol,
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
                    solSymbol,
                ),
            ).toEqual([solAccountWithStaking]);
        });

        it('should return the same stable empty-array reference when no sol account has staking', () => {
            const testState = getTestState({
                accounts: [solAccountNoStaking, etcAccount],
            });

            const first = selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(
                testState,
                solSymbol,
            );
            const second = selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(
                testState,
                solSymbol,
            );

            expect(first).toEqual([]);
            expect(first).toBe(second);
        });

        it('should return the same array reference across calls when underlying state is unchanged', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking, solAccountNoStaking, etcAccount],
            });

            const first = selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(
                testState,
                solSymbol,
            );
            const second = selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol(
                testState,
                solSymbol,
            );

            expect(first).toBe(second);
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
                    sol1Key,
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
                    sol1Key,
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
                    sol3Key,
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
                    sol3Key,
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
                    sol3Key,
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
                    sol3Key,
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
                    sol3Key,
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
                    sol1Key,
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
                    nonExistentKey,
                ),
            ).toEqual('0');
        });

        it('should exclude deactivating stake from the staked balance', () => {
            const testState = getTestState({
                accounts: [solAccountWithActiveAndDeactivatingStaking],
            });

            expect(
                selectSolanaStakedBalanceByAccountKey(
                    {
                        ...testState,
                    },
                    sol5Key,
                ),
            ).toEqual('1');
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
                    sol1Key,
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
                    sol3Key,
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
                    nonExistentKey,
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
                    sol3Key,
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
                    nonExistentKey,
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
                    sol1Key,
                ),
            ).toEqual('0');
        });
    });

    describe('selectSolanaClaimableAmountByAccountKey', () => {
        it('should return "0" for account without claimable stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            const result = selectSolanaClaimableAmountByAccountKey(testState, sol1Key);

            expect(result).toBe('0');
        });

        it('should return claimable balance for account with deactivated stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithDeactivatedStaking],
            });

            const result = selectSolanaClaimableAmountByAccountKey(testState, sol4Key);

            expect(result).toBe('3');
        });

        it('should return "0" for account without staking', () => {
            const testState = getTestState({
                accounts: [solAccountNoStaking],
            });

            const result = selectSolanaClaimableAmountByAccountKey(testState, sol2Key);

            expect(result).toBe('0');
        });

        it('should return "0" for non-existent account', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            const result = selectSolanaClaimableAmountByAccountKey(testState, nonExistentKey2);

            expect(result).toBe('0');
        });
    });

    describe('selectSolanaCanClaimByAccountKey', () => {
        it('should return false for account without claimable stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            const result = selectSolanaCanClaimByAccountKey(testState, sol1Key);

            expect(result).toBe(false);
        });

        it('should return true for account with deactivated stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithDeactivatedStaking],
            });

            const result = selectSolanaCanClaimByAccountKey(testState, sol4Key);

            expect(result).toBe(true);
        });

        it('should return false for account without staking', () => {
            const testState = getTestState({
                accounts: [solAccountNoStaking],
            });

            const result = selectSolanaCanClaimByAccountKey(testState, sol2Key);

            expect(result).toBe(false);
        });

        it('should return false for non-existent account', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            const result = selectSolanaCanClaimByAccountKey(testState, nonExistentKey2);

            expect(result).toBe(false);
        });
    });
});
