import { useEffect, useMemo, useRef } from 'react';

import { getAccountEverstakeStakingPool, isPending } from '@suite-common/wallet-utils';
import { selectAccountClaimTransactions } from '@suite-common/wallet-core';
import { notificationsActions } from '@suite-common/toast-notifications';

import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { ClaimReadyCard } from './ClaimReadyCard';
import { ClaimPendingCard } from './ClaimPendingCard';

export const ClaimCard = () => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const claimTxs = useSelector(state =>
        selectAccountClaimTransactions(state, selectedAccount?.key || ''),
    );

    const isClaimPending = useMemo(() => claimTxs.some(tx => isPending(tx)), [claimTxs]);

    const { canClaim = false, claimableAmount = '0' } =
        getAccountEverstakeStakingPool(selectedAccount) ?? {};

    // Show success message when claim tx confirmation is complete.
    const prevIsClaimPending = useRef(false);
    const dispatch = useDispatch();

    useEffect(() => {
        // Reset prevIsClaimPending when account changes
        prevIsClaimPending.current = false;
    }, [selectedAccount?.key]);

    useEffect(() => {
        if (prevIsClaimPending.current && !isClaimPending) {
            dispatch(
                notificationsActions.addToast({
                    type: 'successful-claim',
                    symbol: selectedAccount?.symbol.toUpperCase() || '',
                }),
            );
            prevIsClaimPending.current = false;
        }

        prevIsClaimPending.current = isClaimPending;
    }, [dispatch, isClaimPending, selectedAccount?.symbol, selectedAccount?.key]);

    if (!canClaim) return null;

    return isClaimPending ? (
        <ClaimPendingCard claimAmount={claimableAmount} />
    ) : (
        <ClaimReadyCard claimAmount={claimableAmount} />
    );
};
