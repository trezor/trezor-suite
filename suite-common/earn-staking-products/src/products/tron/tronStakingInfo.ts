import {
    type StakingAccount,
    type StakingAmount,
    type TronResourceAmounts,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

const TRON_DECIMALS = 6;
const TRON_REWARD_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type ParsedTronUnstakingBatch = {
    amount: StakingAmount;
    availableAt: number;
};

export type ParsedTronVote = {
    address: string;
    amount: StakingAmount;
};

export type ParsedTronStakingInfo = {
    frozen: StakingAmount;
    frozenByResource: TronResourceAmounts;
    delegatedByResource: TronResourceAmounts;
    unstakingBatches: readonly ParsedTronUnstakingBatch[];
    votes: readonly ParsedTronVote[];
    unallocatedVotingPower: StakingAmount;
    unclaimedReward: StakingAmount;
    rewardClaimAvailableAt: number | null;
};

const parseSun = (value: string): StakingAmount | null => {
    const result = stakingAmountSchema.safeParse(value);

    return result.success ? result.data : null;
};

// Blockbook reports votes and voting power in TRX; positions keep every amount in sun.
const parseTrxAsSun = (value: string): StakingAmount | null => {
    const trx = new BigNumber(value);

    return trx.isFinite() ? parseSun(trx.shiftedBy(TRON_DECIMALS).toFixed()) : null;
};

const toMilliseconds = (seconds: number) => Math.round(seconds * 1000);

// A malformed vote or batch is left out; a malformed core amount leaves the
// account without a position instead of failing the sync of the whole account.
export const parseTronStakingInfo = ({ misc }: StakingAccount): ParsedTronStakingInfo | null => {
    const stakingInfo = misc?.tronResources?.stakingInfo;

    if (stakingInfo === undefined) return null;

    const frozen = parseSun(stakingInfo.stakedBalance);
    const frozenEnergy = parseSun(stakingInfo.stakedBalanceEnergy);
    const frozenBandwidth = parseSun(stakingInfo.stakedBalanceBandwidth);
    const delegatedEnergy = parseSun(stakingInfo.delegatedBalanceEnergy);
    const delegatedBandwidth = parseSun(stakingInfo.delegatedBalanceBandwidth);
    const unallocatedVotingPower = parseTrxAsSun(stakingInfo.availableVotingPower);
    const unclaimedReward = parseSun(stakingInfo.unclaimedReward);

    if (
        frozen === null ||
        frozenEnergy === null ||
        frozenBandwidth === null ||
        delegatedEnergy === null ||
        delegatedBandwidth === null ||
        unallocatedVotingPower === null ||
        unclaimedReward === null
    ) {
        return null;
    }

    const unstakingBatches = stakingInfo.unstakingBatches.flatMap(({ amount, expireTime }) => {
        const parsedAmount = parseSun(amount);

        return parsedAmount === null || !Number.isFinite(expireTime)
            ? []
            : [{ amount: parsedAmount, availableAt: toMilliseconds(expireTime) }];
    });

    const votes = stakingInfo.votes.flatMap(({ address, voteCount }) => {
        const amount = parseTrxAsSun(voteCount);

        return address === '' || amount === null ? [] : [{ address, amount }];
    });

    const frozenByResource = { energy: frozenEnergy, bandwidth: frozenBandwidth };
    const delegatedByResource = { energy: delegatedEnergy, bandwidth: delegatedBandwidth };

    const rewardClaimAvailableAt =
        stakingInfo.latestWithdrawTime > 0
            ? toMilliseconds(stakingInfo.latestWithdrawTime) + TRON_REWARD_CLAIM_COOLDOWN_MS
            : null;

    return {
        frozen,
        frozenByResource,
        delegatedByResource,
        unstakingBatches,
        votes,
        unallocatedVotingPower,
        unclaimedReward,
        rewardClaimAvailableAt,
    };
};
