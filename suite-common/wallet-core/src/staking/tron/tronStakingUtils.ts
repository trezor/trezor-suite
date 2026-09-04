import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type GeneralPrecomposedTransaction,
    type SupportedTronNetworkSymbols,
    type TronResourceType,
    type WalletAccountTransaction,
    supportedTronNetworkSymbols,
} from '@suite-common/wallet-types';
import {
    getTronAccountTotalStakingBalance,
    getTronStakingInfo,
    sunToTrx,
} from '@suite-common/wallet-utils';
import {
    type TronAccountExtraData,
    type TronUnstakingBatch,
    type TronVote,
} from '@trezor/blockchain-link-types';
import { getFirmwareVersionArray } from '@trezor/device-utils';
import { BigNumber, isArrayMember, versionUtils } from '@trezor/utils';

import { TRON_STAKING_CONTRACT_TYPES } from './tronStakingConstants';

export function isSupportedTronStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is NetworkSymbol & SupportedTronNetworkSymbols {
    return isArrayMember(symbol as string, supportedTronNetworkSymbols);
}

export const isTronClaimSupported = (device: TrezorDevice | undefined): boolean => {
    const firmware = getFirmwareVersionArray(device);

    if (firmware === null) {
        return false;
    }

    return versionUtils.isNewerOrEqual(firmware, [2, 12, 2]);
};

export const isTronStakingTx = (transaction: WalletAccountTransaction) =>
    TRON_STAKING_CONTRACT_TYPES.some(type => type === transaction.tronSpecific?.contractType);

export const isTronStakingActive = (account: Account | null): boolean => {
    const stakingInfo = getTronStakingInfo(account ?? undefined);
    if (!stakingInfo) return false;

    return new BigNumber(stakingInfo.stakedBalance).isGreaterThan(0);
};

export const getTronCryptoBalanceWithStaking = (account: Account): string => {
    const stakingBalance = getTronAccountTotalStakingBalance(account) ?? '0';

    return new BigNumber(account.formattedBalance).plus(stakingBalance).toString();
};

export const getTronStakingRewards = (account: Account): string => {
    const stakingInfo = getTronStakingInfo(account);
    if (!stakingInfo) return '0';

    return sunToTrx(stakingInfo.unclaimedReward, account.symbol);
};

export const TRON_REWARD_CLAIM_COOLDOWN_SECONDS = 24 * 60 * 60;

export const getTronRewardClaimCooldownEndsAt = (account: Account): number | null => {
    const stakingInfo = getTronStakingInfo(account);
    if (!stakingInfo?.latestWithdrawTime) return null;

    return stakingInfo.latestWithdrawTime + TRON_REWARD_CLAIM_COOLDOWN_SECONDS;
};

export const isTronRewardClaimOnCooldown = (account: Account): boolean => {
    const cooldownEndsAt = getTronRewardClaimCooldownEndsAt(account);
    if (cooldownEndsAt === null) return false;

    return Date.now() / 1000 < cooldownEndsAt;
};

const sumUnstakingBatchesSun = (
    account: Account,
    predicate: (batch: TronUnstakingBatch) => boolean,
): string => {
    const stakingInfo = getTronStakingInfo(account);
    if (!stakingInfo) return '0';

    const totalSun = stakingInfo.unstakingBatches.reduce(
        (acc, batch) => (predicate(batch) ? acc.plus(batch.amount) : acc),
        new BigNumber(0),
    );

    return sunToTrx(totalSun.toString(), account.symbol);
};

export const getTronUnstakingBalance = (account: Account): string =>
    sumUnstakingBatchesSun(account, () => true);

export const getTronWithdrawableBalance = (account: Account): string => {
    const nowSeconds = Date.now() / 1000;

    return sumUnstakingBatchesSun(account, batch => batch.expireTime <= nowSeconds);
};

export const getTronPendingUnstakeBalance = (account: Account): string => {
    const nowSeconds = Date.now() / 1000;

    return sumUnstakingBatchesSun(account, batch => batch.expireTime > nowSeconds);
};

export const getTronVotes = (account?: Account): TronVote[] =>
    getTronStakingInfo(account)?.votes ?? [];

export const getTronTotalVotingPower = (account?: Account): string =>
    getTronStakingInfo(account)?.totalVotingPower ?? '0';

export const getTronAvailableVotingPower = (account?: Account): string =>
    getTronStakingInfo(account)?.availableVotingPower ?? '0';

export const getResourceGain = (
    amount: string,
    resourceType: TronResourceType,
    resources: TronAccountExtraData | undefined,
): number | null => {
    const trx = new BigNumber(amount);

    if (!trx.isFinite() || trx.lte(0) || !resources) return null;

    const [limit, weight] =
        resourceType === 'energy'
            ? [resources.totalEnergyLimit, resources.totalEnergyWeight]
            : [resources.totalBandwidthLimit, resources.totalBandwidthWeight];

    if (!limit || !weight) return null;

    return trx.times(limit).div(weight).toNumber();
};

const getRequiredFreezeTrx = (deficit: number, limit: number, weight: number): string | null =>
    deficit > 0 && limit && weight
        ? new BigNumber(deficit)
              .times(weight)
              .div(limit)
              .integerValue(BigNumber.ROUND_CEIL)
              .toString()
        : null;

export const calculateTronFreezeSuggestion = (
    tx: GeneralPrecomposedTransaction | undefined,
    resources: TronAccountExtraData | undefined,
): string | null => {
    if (!tx || tx.type === 'error' || !('bytes' in tx) || !resources) return null;

    const energyConsumed = 'energyConsumed' in tx ? (tx.energyConsumed ?? 0) : 0;

    return getRequiredFreezeTrx(
        energyConsumed - resources.availableEnergy,
        resources.totalEnergyLimit,
        resources.totalEnergyWeight,
    );
};
