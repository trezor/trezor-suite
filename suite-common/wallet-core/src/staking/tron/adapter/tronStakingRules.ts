import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { getTronStakingInfo } from '@suite-common/wallet-utils';
import { type TronVote } from '@trezor/blockchain-link-types';
import { getFirmwareVersionArray } from '@trezor/device-utils';
import { BigNumber, versionUtils } from '@trezor/utils';

import { type TronVotingPower } from './types';
import { type TronVoteAllocation } from '../actions/vote/voteContract';
import {
    TRON_REWARD_CLAIM_COOLDOWN_SECONDS,
    TRON_REWARD_CLAIM_MIN_FIRMWARE,
} from '../tronStakingConstants';

const toWholeVotes = (votingPower: string): number =>
    new BigNumber(votingPower).integerValue(BigNumber.ROUND_FLOOR).toNumber();

export const getTronAccountVotes = (account: Account): TronVote[] =>
    getTronStakingInfo(account)?.votes ?? [];

export const getTronAccountVotingPower = (account: Account): TronVotingPower => {
    const stakingInfo = getTronStakingInfo(account);

    return {
        total: stakingInfo?.totalVotingPower ?? '0',
        available: stakingInfo?.availableVotingPower ?? '0',
    };
};

export const getTronAccountCastableVotes = (account: Account): number =>
    toWholeVotes(getTronAccountVotingPower(account).total);

export const getTronAccountVoteAllocations = (account: Account): TronVoteAllocation[] =>
    getTronAccountVotes(account)
        .map(({ address, voteCount }) => ({ address, count: toWholeVotes(voteCount) }))
        .filter(({ count }) => count > 0);

export const getTronRewardClaimCooldownEndsAt = (account: Account): number | null => {
    const latestWithdrawTime = getTronStakingInfo(account)?.latestWithdrawTime;

    if (!latestWithdrawTime) return null;

    return latestWithdrawTime + TRON_REWARD_CLAIM_COOLDOWN_SECONDS;
};

export const isTronRewardClaimSupported = (device: TrezorDevice | undefined): boolean => {
    const firmware = getFirmwareVersionArray(device);

    if (firmware === null) return false;

    return versionUtils.isNewerOrEqual(firmware, TRON_REWARD_CLAIM_MIN_FIRMWARE);
};
