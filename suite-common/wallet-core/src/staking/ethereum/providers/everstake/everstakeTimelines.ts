import { type EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { secondsToDays } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type EverstakeEthereumStats } from '../../ethereumStakingStats';
import {
    type StakingTimelineContext,
    type StakingTimelineDefaults,
    type StakingTimelines,
} from '../types';
import {
    BACKUP_REWARD_PAYOUT_DAYS,
    DAYS_TO_ADD_TO_POOL_DEFAULT,
    UNSTAKING_ETH_PERIOD,
} from './everstakeConstants';

export const EVERSTAKE_TIMELINE_DEFAULTS: StakingTimelineDefaults = {
    entryDays: DAYS_TO_ADD_TO_POOL_DEFAULT,
    rewardPayoutDays: BACKUP_REWARD_PAYOUT_DAYS,
};

const atLeastOneDay = (daysToWait: number) => (daysToWait <= 0 ? 1 : daysToWait);

export const getDaysToAddToPool = (
    stakeTxs: WalletAccountTransaction[],
    validatorsQueue?: EthValidatorsQueue | null,
) => {
    if (
        validatorsQueue?.addingDelay === undefined ||
        validatorsQueue?.activationTime === undefined
    ) {
        return undefined;
    }

    const lastTxBlockTime = stakeTxs[0]?.blockTime;
    if (!lastTxBlockTime) return undefined;

    const now = Math.floor(Date.now() / 1000);

    const secondsToWait =
        lastTxBlockTime + validatorsQueue.addingDelay + validatorsQueue.activationTime - now;

    return atLeastOneDay(secondsToDays(secondsToWait));
};

export const getDaysToUnstake = (
    unstakeTxs: WalletAccountTransaction[],
    validatorsQueue?: EthValidatorsQueue | null,
) => {
    if (typeof validatorsQueue?.withdrawTime !== 'number') return undefined;

    const now = Math.floor(Date.now() / 1000);
    const lastTxBlockTime = unstakeTxs[0]?.blockTime || now;

    const secondsToWait =
        lastTxBlockTime + validatorsQueue.withdrawTime + (validatorsQueue?.exitTime || 0) - now;

    return atLeastOneDay(secondsToDays(secondsToWait));
};

export const getEverstakeInitialEntryDays = (validatorsQueue?: EthValidatorsQueue | null) => {
    if (
        validatorsQueue?.addingDelay === undefined ||
        validatorsQueue?.activationTime === undefined
    ) {
        return undefined;
    }

    const secondsToWait = validatorsQueue.addingDelay + validatorsQueue.activationTime;

    return atLeastOneDay(secondsToDays(secondsToWait));
};

export const getEverstakeExitPeriodInDays = (validatorsQueue?: EthValidatorsQueue | null) => {
    const { withdrawTime, exitTime } = validatorsQueue ?? {};

    if (typeof withdrawTime !== 'number' || typeof exitTime !== 'number') {
        return UNSTAKING_ETH_PERIOD;
    }

    return secondsToDays(new BigNumber(withdrawTime).plus(exitTime).toNumber());
};

export const getEverstakeNextRewardPayoutDays = (stats: EverstakeEthereumStats | undefined) => {
    const nextRewardPayout = stats?.stats?.nextRewardPayout;

    if (!nextRewardPayout) return null;

    return Math.max(1, secondsToDays(nextRewardPayout));
};

export const getEverstakeTimelines = (
    stats: EverstakeEthereumStats | undefined,
    { stakeTxs, unstakeTxs }: StakingTimelineContext,
): StakingTimelines => {
    const validators = stats?.validators;

    return {
        entryDays: getDaysToAddToPool(stakeTxs, validators),
        exitDays: getDaysToUnstake(unstakeTxs, validators),
        initialEntryDays: getEverstakeInitialEntryDays(validators),
        exitPeriodDays: getEverstakeExitPeriodInDays(validators),
        nextRewardPayoutDays: getEverstakeNextRewardPayoutDays(stats),
    };
};
