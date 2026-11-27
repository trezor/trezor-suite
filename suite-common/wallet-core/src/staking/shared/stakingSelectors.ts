import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey } from '../../accounts/accountsSelectors';
import { DEFAULT_VOTING_OPTION } from '../cardano/cardanoStakingConstants';
import type {
    AccountVotingDelegation,
    VotingDelegationOption,
} from '../cardano/cardanoStakingTypes';
import { type StakeSliceRootState } from '../stakingReducerTypes';

export const selectStake = (state: StakeSliceRootState) => state.wallet.stake;

export const selectStakeAccountKey = (state: StakeSliceRootState) => selectStake(state).accountKey;

export const selectStakePrecomposedForm = (state: StakeSliceRootState) =>
    selectStake(state).precomposedForm;

export const selectStakeAccount = (
    state: StakeSliceRootState & AccountsRootState,
): Account | undefined => {
    const accountKey = selectStakeAccountKey(state);

    if (!accountKey) return undefined;

    return selectAccountByKey(state, accountKey) ?? undefined;
};

/**
 * The selection the user last confirmed, together with the account it was confirmed for. Composing
 * paths pass it to `prepareTxPlan`, which honours it only for that very account; anything reading it
 * to render a selection wants `selectVotingDelegationOption` instead.
 */
export const selectStakeVotingDelegation = (
    state: StakeSliceRootState,
): AccountVotingDelegation | undefined => selectStake(state).votingDelegation;

export const selectVotingDelegationOption = (
    state: StakeSliceRootState,
    accountKey: AccountKey,
): VotingDelegationOption => {
    const votingDelegation = selectStakeVotingDelegation(state);

    return votingDelegation?.accountKey === accountKey
        ? votingDelegation.option
        : DEFAULT_VOTING_OPTION;
};
