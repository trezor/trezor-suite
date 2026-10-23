import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type SupportedTronNetworkSymbols,
    type TronResourceType,
    type WalletAccountTransaction,
    supportedTronNetworkSymbols,
} from '@suite-common/wallet-types';
import { sunToTrx } from '@suite-common/wallet-utils';
import {
    type TronAccountExtraData,
    type TronUnstakingBatch,
    type TronVote,
} from '@trezor/blockchain-link-types';
import { returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber, isArrayMember } from '@trezor/utils';

import { type TronVoteAllocation } from './adapter/contracts/voteContract';
import { tronStakingAdapter } from './adapter/tronStakingAdapter';
import { TRON_UNFREEZE_DELAY_DAYS } from './tronStakingConstants';
import { deriveStakingPositions } from '../positions/deriveStakingPositions';
import { type StakingPosition } from '../positions/positionsTypes';
import { summarizeStakingPositions } from '../positions/summarizeStakingPositions';

export function isSupportedTronStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedTronNetworkSymbols {
    return isArrayMember(symbol, supportedTronNetworkSymbols);
}

export const isTronClaimSupported = (device: TrezorDevice | undefined): boolean =>
    tronStakingAdapter.isRewardClaimSupported(device);

export const isTronStakingTx = (transaction: WalletAccountTransaction) =>
    tronStakingAdapter.classifyTransaction(transaction) !== null;

const getTronStakingPositions = (account: Account | null): StakingPosition[] =>
    account?.networkType === 'tron' ? deriveStakingPositions(account) : returnStableArrayIfEmpty();

const getTronStakingSummary = (account: Account | null) =>
    summarizeStakingPositions(getTronStakingPositions(account));

export const isTronStakingActive = (account: Account | null): boolean =>
    new BigNumber(getTronStakingSummary(account).staked).isGreaterThan(0);

// Only the frozen TRX is added; unfreeze batches stay out of the balance.
export const getTronCryptoBalanceWithStaking = (account: Account): string =>
    new BigNumber(account.formattedBalance).plus(getTronStakingSummary(account).staked).toString();

export const getTronStakingRewards = (account: Account): string =>
    tronStakingAdapter.getClaimableRewards(account);

export const getTronRewardClaimCooldownEndsAt = (account: Account): number | null =>
    tronStakingAdapter.getRewardClaimCooldownEndsAt(account);

export const isTronRewardClaimOnCooldown = (account: Account): boolean => {
    const cooldownEndsAt = getTronRewardClaimCooldownEndsAt(account);
    if (cooldownEndsAt === null) return false;

    return Date.now() / 1000 < cooldownEndsAt;
};

export const getTronUnstakingBalance = (account: Account): string =>
    getTronStakingSummary(account).unstaking;

export const TRON_UNFREEZE_DELAY_SECONDS = TRON_UNFREEZE_DELAY_DAYS * 24 * 60 * 60;

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
    const candidates = getUnfreezeTransactionCandidates(transactions);
    const usedCandidates = new Set<UnfreezeTransactionCandidate>();

    return tronStakingAdapter
        .getUnfreezeBatches(account)
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

export const getTronWithdrawableBalance = (
    account: Account,
    nowSeconds: number = Date.now() / 1000,
): string => tronStakingAdapter.getWithdrawableAmount(account, nowSeconds);

export const getTronPendingUnstakeBalance = (
    account: Account,
    nowSeconds: number = Date.now() / 1000,
): string => tronStakingAdapter.getPendingUnfreezeAmount(account, nowSeconds);

export const getTronVotes = (account?: Account): TronVote[] =>
    account ? tronStakingAdapter.getVotes(account) : [];

export const getTronTotalVotingPower = (account?: Account): string =>
    account ? tronStakingAdapter.getVotingPower(account).total : '0';

export const getTronAvailableVotingPower = (account?: Account): string =>
    account ? tronStakingAdapter.getVotingPower(account).available : '0';

export const getTotalVotes = (account: Account): number =>
    tronStakingAdapter.getCastableVotes(account);

export const getCurrentVoteAllocations = (account: Account): TronVoteAllocation[] =>
    tronStakingAdapter.getVoteAllocations(account);

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
