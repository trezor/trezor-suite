import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { getTronStakingInfo, sunToTrx } from '@suite-common/wallet-utils';
import { type TronUnstakingBatch, type TronVote } from '@trezor/blockchain-link-types';
import { getFirmwareVersionArray } from '@trezor/device-utils';
import { BigNumber, versionUtils } from '@trezor/utils';

import { type TronVoteAllocation } from './contracts/voteContract';
import { deriveTronStakingPositions } from './tronStakingPositions';
import { type TronVotingPower } from './types';
import { summarizeStakingPositions } from '../../positions/summarizeStakingPositions';
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

export const getTronUnfreezeBatches = (account: Account): TronUnstakingBatch[] =>
    deriveTronStakingPositions(account).flatMap(({ details }) =>
        details.type === 'tron-unattributed' ? details.unstakingBatches : [],
    );

type SumUnfreezeBatchesParams = {
    account: Account;
    isIncluded: (batch: TronUnstakingBatch) => boolean;
};

const sumUnfreezeBatches = ({ account, isIncluded }: SumUnfreezeBatchesParams): string => {
    const totalSun = getTronUnfreezeBatches(account).reduce(
        (total, batch) => (isIncluded(batch) ? total.plus(batch.amount) : total),
        new BigNumber(0),
    );

    return sunToTrx(totalSun.toString(), account.symbol);
};

export const getTronWithdrawableAmount = (account: Account, nowSeconds: number): string =>
    sumUnfreezeBatches({ account, isIncluded: batch => batch.expireTime <= nowSeconds });

export const getTronPendingUnfreezeAmount = (account: Account, nowSeconds: number): string =>
    sumUnfreezeBatches({ account, isIncluded: batch => batch.expireTime > nowSeconds });

export const getTronClaimableRewards = (account: Account): string =>
    summarizeStakingPositions(deriveTronStakingPositions(account)).claimableRewards;

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
