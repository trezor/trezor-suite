import { BigNumber } from '@trezor/utils';

import {
    TRX_BEST_BLOCK,
    TRX_FIRST_ACCOUNT_ADDRESS,
    TRX_FUNDING_TX,
    TRX_MOCKED_ACCOUNT,
    TRX_MOCKED_RESOURCES,
    TRX_RESOURCE_LIMITS,
    buildTrxStakingTx,
} from '../../support/mocks/trx-endpoints';

const TRX_DECIMALS = 6;

type TrxFrozenAccountParams = {
    // Frozen amount in TRX and in Sun.
    stakeAmount: string;
    stakeAmountSun: string;
    freezeTxid: string;
};

export const trxToSun = (amount: string) => new BigNumber(amount).shiftedBy(TRX_DECIMALS).toFixed();

export const sunToTrx = (amountSun: string) =>
    new BigNumber(amountSun).shiftedBy(-TRX_DECIMALS).toFixed();

// Formats a Sun amount the way Suite displays TRX balances, e.g. `1,000 TRX`.
export const formatSunAsTrx = (amountSun: string) =>
    `${new BigNumber(amountSun).shiftedBy(-TRX_DECIMALS).toFormat()} TRX`;

type TrxVotedAccountParams = TrxFrozenAccountParams & {
    voteTxid: string;
    representativeAddress: string;
};

type TrxUnstakingAccountParams = TrxVotedAccountParams & {
    unstakeAmount: string;
    unstakeAmountSun: string;
    unstakeTxid: string;
    expireTime: number;
};

type TrxWithdrawnAccountParams = TrxUnstakingAccountParams & {
    withdrawTxid: string;
};

type TrxRewardedAccountParams = TrxVotedAccountParams & {
    // Unclaimed voting reward in Sun.
    rewardAmountSun: string;
};

type TrxClaimedAccountParams = TrxRewardedAccountParams & {
    claimTxid: string;
    claimTime: number;
};

// Bandwidth gained by freezing `stakeAmount` TRX on the mocked network.
export const getTrxBandwidthGain = (stakeAmount: string) =>
    Math.round(
        (Number(stakeAmount) * TRX_RESOURCE_LIMITS.totalBandwidthLimit) /
            TRX_RESOURCE_LIMITS.totalBandwidthWeight,
    );

const buildFrozenResources = ({ stakeAmount, stakeAmountSun }: TrxFrozenAccountParams) => {
    const bandwidthGain = getTrxBandwidthGain(stakeAmount);

    return {
        ...TRX_MOCKED_RESOURCES,
        availableStakedBandwidth: bandwidthGain,
        totalStakedBandwidth: bandwidthGain,
        stakingInfo: {
            ...TRX_MOCKED_RESOURCES.stakingInfo!,
            stakedBalance: stakeAmountSun,
            stakedBalanceBandwidth: stakeAmountSun,
            totalVotingPower: stakeAmount,
            availableVotingPower: stakeAmount,
        },
    };
};

// The first account after a confirmed freeze of `stakeAmount` TRX for bandwidth, with no votes
// assigned yet.
export const buildTrxFrozenAccountState = (params: TrxFrozenAccountParams) => {
    const freezeTx = buildTrxStakingTx({
        txid: params.freezeTxid,
        address: TRX_FIRST_ACCOUNT_ADDRESS,
        blockHeight: TRX_BEST_BLOCK.height + 1,
        payload: {
            contractType: 'FreezeBalanceV2Contract',
            operation: 'freeze',
            resource: 'BANDWIDTH',
            stakeAmount: params.stakeAmountSun,
        },
    });

    return {
        balance: (BigInt(TRX_MOCKED_ACCOUNT.balance) - BigInt(params.stakeAmountSun)).toString(),
        txs: 2,
        nonTokenTxs: 2,
        transactions: [freezeTx, TRX_FUNDING_TX],
        chainExtraData: { payloadType: 'tron', payload: buildFrozenResources(params) },
    };
};

// The frozen account after a confirmed vote assigning all voting power to one representative.
export const buildTrxVotedAccountState = (params: TrxVotedAccountParams) => {
    const frozenAccountState = buildTrxFrozenAccountState(params);
    const frozenResources = buildFrozenResources(params);
    const voteTx = buildTrxStakingTx({
        txid: params.voteTxid,
        address: TRX_FIRST_ACCOUNT_ADDRESS,
        blockHeight: TRX_BEST_BLOCK.height + 2,
        payload: {
            contractType: 'VoteWitnessContract',
            operation: 'vote',
            votes: [{ address: params.representativeAddress, count: params.stakeAmount }],
        },
    });

    return {
        ...frozenAccountState,
        txs: 3,
        nonTokenTxs: 3,
        transactions: [voteTx, ...frozenAccountState.transactions],
        chainExtraData: {
            payloadType: 'tron',
            payload: {
                ...frozenResources,
                stakingInfo: {
                    ...frozenResources.stakingInfo,
                    availableVotingPower: '0',
                    votes: [
                        { address: params.representativeAddress, voteCount: params.stakeAmount },
                    ],
                },
            },
        },
    };
};

// The voted account after a confirmed unfreeze of `unstakeAmount` TRX from the bandwidth stake.
// Tron lowers the voting power with the stake, so the remaining votes go to the same representative.
export const buildTrxUnstakingAccountState = (params: TrxUnstakingAccountParams) => {
    const votedAccountState = buildTrxVotedAccountState(params);
    const remainingStakeSun = (
        BigInt(params.stakeAmountSun) - BigInt(params.unstakeAmountSun)
    ).toString();
    const remainingStake = (Number(params.stakeAmount) - Number(params.unstakeAmount)).toString();
    const remainingBandwidth = getTrxBandwidthGain(remainingStake);
    const unstakeTx = buildTrxStakingTx({
        txid: params.unstakeTxid,
        address: TRX_FIRST_ACCOUNT_ADDRESS,
        blockHeight: TRX_BEST_BLOCK.height + 3,
        payload: {
            contractType: 'UnfreezeBalanceV2Contract',
            operation: 'unstake',
            resource: 'BANDWIDTH',
            unstakeAmount: params.unstakeAmountSun,
        },
    });

    return {
        ...votedAccountState,
        txs: 4,
        nonTokenTxs: 4,
        transactions: [unstakeTx, ...votedAccountState.transactions],
        chainExtraData: {
            payloadType: 'tron',
            payload: {
                ...votedAccountState.chainExtraData.payload,
                availableStakedBandwidth: remainingBandwidth,
                totalStakedBandwidth: remainingBandwidth,
                stakingInfo: {
                    ...votedAccountState.chainExtraData.payload.stakingInfo,
                    stakedBalance: remainingStakeSun,
                    stakedBalanceBandwidth: remainingStakeSun,
                    unstakingBatches: [
                        { amount: params.unstakeAmountSun, expireTime: params.expireTime },
                    ],
                    totalVotingPower: remainingStake,
                    availableVotingPower: '0',
                    votes: [{ address: params.representativeAddress, voteCount: remainingStake }],
                },
            },
        },
    };
};

// The unstaking account after its expired batch was withdrawn back to the available balance.
export const buildTrxWithdrawnAccountState = (params: TrxWithdrawnAccountParams) => {
    const unstakingAccountState = buildTrxUnstakingAccountState(params);
    const withdrawTx = buildTrxStakingTx({
        txid: params.withdrawTxid,
        address: TRX_FIRST_ACCOUNT_ADDRESS,
        blockHeight: TRX_BEST_BLOCK.height + 4,
        payload: {
            contractType: 'WithdrawExpireUnfreezeContract',
            operation: 'withdraw',
            unstakeAmount: params.unstakeAmountSun,
        },
    });

    return {
        ...unstakingAccountState,
        balance: (
            BigInt(unstakingAccountState.balance) + BigInt(params.unstakeAmountSun)
        ).toString(),
        txs: 5,
        nonTokenTxs: 5,
        transactions: [withdrawTx, ...unstakingAccountState.transactions],
        chainExtraData: {
            payloadType: 'tron',
            payload: {
                ...unstakingAccountState.chainExtraData.payload,
                stakingInfo: {
                    ...unstakingAccountState.chainExtraData.payload.stakingInfo,
                    unstakingBatches: [],
                },
            },
        },
    };
};

// The voted account once its representative has paid out `rewardAmountSun` of voting rewards that
// are still waiting to be claimed.
export const buildTrxRewardedAccountState = (params: TrxRewardedAccountParams) => {
    const votedAccountState = buildTrxVotedAccountState(params);

    return {
        ...votedAccountState,
        chainExtraData: {
            payloadType: 'tron',
            payload: {
                ...votedAccountState.chainExtraData.payload,
                stakingInfo: {
                    ...votedAccountState.chainExtraData.payload.stakingInfo,
                    unclaimedReward: params.rewardAmountSun,
                },
            },
        },
    };
};

// The rewarded account after a confirmed claim moved the reward to the available balance. Tron
// records the claim time, which starts the 24-hour cooldown before the next claim.
export const buildTrxClaimedAccountState = (params: TrxClaimedAccountParams) => {
    const rewardedAccountState = buildTrxRewardedAccountState(params);
    const claimTx = buildTrxStakingTx({
        txid: params.claimTxid,
        address: TRX_FIRST_ACCOUNT_ADDRESS,
        blockHeight: TRX_BEST_BLOCK.height + 3,
        payload: {
            contractType: 'WithdrawBalanceContract',
            operation: 'claim',
            claimedVoteReward: params.rewardAmountSun,
        },
    });

    return {
        ...rewardedAccountState,
        balance: (BigInt(rewardedAccountState.balance) + BigInt(params.rewardAmountSun)).toString(),
        txs: 4,
        nonTokenTxs: 4,
        transactions: [claimTx, ...rewardedAccountState.transactions],
        chainExtraData: {
            payloadType: 'tron',
            payload: {
                ...rewardedAccountState.chainExtraData.payload,
                stakingInfo: {
                    ...rewardedAccountState.chainExtraData.payload.stakingInfo,
                    unclaimedReward: '0',
                    latestWithdrawTime: params.claimTime,
                },
            },
        },
    };
};
