import { TrezorDevice } from '@suite-common/suite-types';
import { StakeState, stakeInitialState } from '@suite-common/wallet-core';
import { Account, Timestamp } from '@suite-common/wallet-types';

import {
    selectExpectedRewardsForEpoch,
    selectSolStakingAccountsInfoByAccountKey,
    selectSolanaAPYByAccountKey,
    selectSolanaIsStakePendingByAccountKey,
    selectSolanaStakedBalanceByAccountKey,
    selectSolanaTotalStakePendingByAccountKey,
    selectVisibleDeviceSolanaAccountsWithStakingByNetworkSymbol,
} from '../solanaStakingSelectors';

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
    getAssets: {
        error: false,
        isLoading: true,
        lastSuccessfulFetchTimestamp: 0 as Timestamp,
        data: {
            apy: 6.21,
        },
    },
};

const getTestState = ({
    accounts,
    withSolStakeData = false,
}: {
    accounts: Account[];
    withSolStakeData?: boolean;
}) => ({
    wallet: {
        accounts,
        stake: { ...stakeInitialState, data: { sol: withSolStakeData ? solStakeData : {} } },
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
                    'sol1',
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
                    'sol1',
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
                    'sol3',
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
                    'sol3',
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
                    'sol3',
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
                    'sol3',
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
                    'sol3',
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
                    'sol1',
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
                    'non-existent-key',
                ),
            ).toEqual('0');
        });
    });

    describe('selectExpectedRewardsForEpoch', () => {
        it('should return correct expected rewards', () => {
            const testState = getTestState({
                accounts: [solAccountWithStaking],
            });

            expect(
                selectExpectedRewardsForEpoch(
                    {
                        ...testState,
                    },
                    'sol1',
                ),
            ).toEqual('0.000376438');
        });

        it('should return "0" for account without activated or deactivating stake', () => {
            const testState = getTestState({
                accounts: [solAccountWithActivatingStaking],
            });

            expect(
                selectExpectedRewardsForEpoch(
                    {
                        ...testState,
                    },
                    'sol3',
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
                    'non-existent-key',
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
                    'sol3',
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
                    'non-existent-key',
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
                    'sol1',
                ),
            ).toEqual('0');
        });
    });
});
