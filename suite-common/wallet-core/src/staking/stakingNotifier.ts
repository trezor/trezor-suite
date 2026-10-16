import { type Account, type StakeType } from '@suite-common/wallet-types';

export type StakingNotifierAccount = Pick<Account, 'symbol' | 'networkType'>;

export type StakingTransactionPushedParams = {
    account: StakingNotifierAccount;
    stakeType: StakeType;
    txid: string;
};

export type StakingTransactionPushFailedParams = {
    account: StakingNotifierAccount;
    stakeType: StakeType;
};

// Platform reactions to a staking broadcast that the shared push thunk cannot own itself, such as
// analytics events whose definitions still differ per app.
export type StakingNotifier = {
    onTransactionPushed: (params: StakingTransactionPushedParams) => void;
    onTransactionPushFailed: (params: StakingTransactionPushFailedParams) => void;
};

export type StakingNotifierDep = {
    stakingNotifier: StakingNotifier;
};
