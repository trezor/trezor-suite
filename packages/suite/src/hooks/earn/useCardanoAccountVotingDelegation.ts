import { useEffect, useMemo } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import { hasCardanoLiveVoteDelegation } from '@suite-common/staking';
import {
    DEFAULT_VOTING_OPTION,
    type VotingDelegationOption,
    selectStakeVotingDelegation,
    stakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

export const useCardanoAccountVotingDelegation = (
    account: Account,
): VotingDelegationOption | undefined => {
    const hasLiveVoteDelegation = hasCardanoLiveVoteDelegation(account);

    return useMemo(
        () => (hasLiveVoteDelegation ? { type: 'current' } : undefined),
        [hasLiveVoteDelegation],
    );
};

export const useSeededCardanoVotingDelegation = (
    account: Account,
): VotingDelegationOption | undefined => {
    const dispatch = useDispatch();
    const accountVotingDelegation = useCardanoAccountVotingDelegation(account);
    const isCardanoAccount = account.networkType === 'cardano';
    // Seeding is driven by the store rather than by a mount-once ref, so that a selection cleared
    // while this stays mounted - after signing, or on an account switch - is seeded again instead
    // of silently reading as Everstake.
    const isSelectionConfirmedForAccount = useSelector(
        state => selectStakeVotingDelegation(state)?.accountKey === account.key,
    );

    useEffect(() => {
        // Fills an empty slot only: later backend updates must not overwrite the user's selection.
        if (!isCardanoAccount || isSelectionConfirmedForAccount) return;

        dispatch(
            stakeActions.setAccountVotingDelegation({
                accountKey: account.key,
                option: accountVotingDelegation ?? DEFAULT_VOTING_OPTION,
            }),
        );
    }, [
        dispatch,
        isCardanoAccount,
        isSelectionConfirmedForAccount,
        account.key,
        accountVotingDelegation,
    ]);

    return accountVotingDelegation;
};
