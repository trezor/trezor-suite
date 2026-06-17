import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type SupportedTronNetworkSymbols,
    supportedTronNetworkSymbols,
} from '@suite-common/wallet-types';
import {
    type TronAccountExtraData,
    type TronStakingInfo,
    type TronUnstakingBatch,
    type TronVote,
} from '@trezor/blockchain-link-types';
import { BigNumber, isArrayMember } from '@trezor/utils';

import { asAmountSubunit } from './AmountTypes';
import { subunitsToUnits } from './amountUtils';

export function isSupportedTronStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedTronNetworkSymbols {
    return isArrayMember(symbol, supportedTronNetworkSymbols);
}

const sunToTrx = (sun: string, symbol: NetworkSymbol) =>
    subunitsToUnits({
        value: asAmountSubunit(new BigNumber(sun)),
        symbol,
    }).toString();

export const getTronResources = (account?: Account): TronAccountExtraData | undefined =>
    account?.networkType === 'tron' ? account.misc?.tronResources : undefined;

export const getTronStakingInfo = (account?: Account): TronStakingInfo | undefined =>
    getTronResources(account)?.stakingInfo;

export const isTronStakingActive = (account: Account | null): boolean => {
    const stakingInfo = getTronStakingInfo(account ?? undefined);
    if (!stakingInfo) return false;

    return new BigNumber(stakingInfo.stakedBalance).isGreaterThan(0);
};

export const getTronAccountTotalStakingBalance = (account: Account): string | null => {
    const stakingInfo = getTronStakingInfo(account);
    if (!stakingInfo) return null;

    return sunToTrx(stakingInfo.stakedBalance, account.symbol);
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
