import { type NetworkSymbol, type StakingProviderId } from '@suite-common/wallet-config';
import {
    type Account,
    type StakeType,
    type SupportedEthereumNetworkSymbol,
    supportedNetworkSymbols,
} from '@suite-common/wallet-types';
import { BigNumber, isArrayMember } from '@trezor/utils';

import {
    DEFAULT_ETHEREUM_STAKING_PROVIDER_ID,
    getEthereumStakingAdapter,
} from './providers/ethereumStakingProviders';
import { type StakingTimelineContext } from './providers/types';
import { deriveEthereumStakingPositions } from '../positions/deriveStakingPositions';

export const EMPTY_STAKING_TIMELINE_CONTEXT: StakingTimelineContext = {
    stakeTxs: [],
    unstakeTxs: [],
};

// The provider of the account's position, or the default one before it has a position.
export const getAccountEthereumStakingProviderId = (account: Account): StakingProviderId =>
    deriveEthereumStakingPositions(account)[0]?.providerId ?? DEFAULT_ETHEREUM_STAKING_PROVIDER_ID;

export const getEthereumStakingContractAddress = (account: Account, stakeType: StakeType) => {
    if (stakeType === 'change-delegate') return '';

    const adapter = getEthereumStakingAdapter(getAccountEthereumStakingProviderId(account));

    return adapter.getStepTarget(stakeType, account.symbol) ?? '';
};

// Only pooled positions add to the native balance; a liquid position is already counted as a token.
export const getEthereumCryptoBalanceWithStaking = (account: Account) =>
    deriveEthereumStakingPositions(account)
        .filter(
            position => getEthereumStakingAdapter(position.providerId).contributesToNativeBalance,
        )
        .reduce(
            (balance, position) => balance.plus(position.total),
            new BigNumber(account.formattedBalance),
        )
        .toString();

export function isSupportedEthStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedEthereumNetworkSymbol {
    return isArrayMember(symbol, supportedNetworkSymbols);
}

// The whole pending stake has been handed to validators and is waiting for activation.
export const hasStakeInPendingDepositedState = (account: Account) =>
    deriveEthereumStakingPositions(account).some(
        ({ pendingStake, activating }) =>
            new BigNumber(activating).gt(0) && new BigNumber(pendingStake).minus(activating).lte(0),
    );
