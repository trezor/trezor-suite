import { useEffect, useMemo, useRef } from 'react';

import {
    DEFAULT_VOTING_OPTION,
    type VotingDelegationOption,
    stakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { hasCardanoLiveVoteDelegation } from '@suite-common/wallet-utils';

import { useDispatch } from 'src/hooks/suite';

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
    // Seeds an initial value only: later backend updates must not overwrite the user's selection.
    const seededAccountKey = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!isCardanoAccount || seededAccountKey.current === account.key) return;

        seededAccountKey.current = account.key;

        dispatch(
            stakeActions.setVotingDelegationOption(
                accountVotingDelegation ?? DEFAULT_VOTING_OPTION,
            ),
        );
    }, [dispatch, isCardanoAccount, account.key, accountVotingDelegation]);

    return accountVotingDelegation;
};
