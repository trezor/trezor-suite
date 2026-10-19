import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
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
): symbol is SupportedTronNetworkSymbols {
    return isArrayMember(symbol, supportedTronNetworkSymbols);
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

export const TRON_UNFREEZE_DELAY_SECONDS = 14 * 24 * 60 * 60;

// Blockbook floors the expiry to seconds and a pending transaction added by Suite carries its
// broadcast time instead of the block time, so the match allows some slack.
const UNFREEZE_MATCH_TOLERANCE_SECONDS = 60 * 60;

export type TronUnstakingBatchWithResource = TronUnstakingBatch & {
    resource?: TronResourceType;
};

type UnfreezeTransactionCandidate = {
    unstakeAmount: string;
    blockTime: number;
    resource: TronResourceType | undefined;
};

// Blockbook reports the unfreeze resource in lower case and omits it for bandwidth; the pending
// transaction added by Suite right after broadcast uses the upper-case protobuf names.
const getUnfreezeTransactionResource = (
    resource: string | undefined,
): TronResourceType | undefined => {
    const normalizedResource = resource?.toLowerCase() ?? '';

    if (normalizedResource === 'energy') return 'energy';
    if (normalizedResource === 'bandwidth' || normalizedResource === '') return 'bandwidth';

    return undefined;
};

const getUnfreezeTransactionCandidates = (
    transactions: WalletAccountTransaction[],
): UnfreezeTransactionCandidate[] =>
    transactions
        .flatMap(transaction => {
            const { tronSpecific, blockTime } = transaction;

            if (
                tronSpecific?.contractType !== 'UnfreezeBalanceV2Contract' ||
                !tronSpecific.unstakeAmount ||
                !blockTime
            ) {
                return [];
            }

            return [
                {
                    unstakeAmount: tronSpecific.unstakeAmount,
                    blockTime,
                    resource: getUnfreezeTransactionResource(tronSpecific.resource),
                },
            ];
        })
        .toSorted((a, b) => a.blockTime - b.blockTime);

const isMatchingUnfreezeTransaction = (
    batch: TronUnstakingBatch,
    candidate: UnfreezeTransactionCandidate,
): boolean =>
    candidate.unstakeAmount === batch.amount &&
    Math.abs(candidate.blockTime + TRON_UNFREEZE_DELAY_SECONDS - batch.expireTime) <=
        UNFREEZE_MATCH_TOLERANCE_SECONDS;

type GetTronUnstakingBatchesWithResourceParams = {
    account: Account;
    transactions: WalletAccountTransaction[];
};

export const getTronUnstakingBatchesWithResource = ({
    account,
    transactions,
}: GetTronUnstakingBatchesWithResourceParams): TronUnstakingBatchWithResource[] => {
    const stakingInfo = getTronStakingInfo(account);

    if (!stakingInfo) return [];

    const candidates = getUnfreezeTransactionCandidates(transactions);
    const usedCandidates = new Set<UnfreezeTransactionCandidate>();

    return stakingInfo.unstakingBatches
        .toSorted((a, b) => a.expireTime - b.expireTime)
        .map(batch => {
            const candidate = candidates.find(
                item => !usedCandidates.has(item) && isMatchingUnfreezeTransaction(batch, item),
            );

            if (candidate) usedCandidates.add(candidate);

            return { ...batch, resource: candidate?.resource };
        });
};

export type TronPendingUnstakingBatch = {
    amount: string;
    daysLocked: number;
    resource: TronResourceType | undefined;
};

type GetTronPendingUnstakingBatchesParams = {
    batches: TronUnstakingBatchWithResource[];
    symbol: NetworkSymbol;
    nowSeconds?: number;
};

const SECONDS_PER_DAY = 24 * 60 * 60;

export const getTronPendingUnstakingBatches = ({
    batches,
    symbol,
    nowSeconds = Date.now() / 1000,
}: GetTronPendingUnstakingBatchesParams): TronPendingUnstakingBatch[] =>
    batches
        .filter(batch => batch.expireTime > nowSeconds)
        .map(batch => ({
            amount: sunToTrx(batch.amount, symbol),
            daysLocked: Math.ceil((batch.expireTime - nowSeconds) / SECONDS_PER_DAY),
            resource: batch.resource,
        }));

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
