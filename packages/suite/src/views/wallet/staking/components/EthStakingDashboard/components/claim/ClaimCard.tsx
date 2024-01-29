import { useEffect, useMemo, useRef } from 'react';
import { isPending } from '@suite-common/wallet-utils';
import { selectAccountClaimTransactions } from '@suite-common/wallet-core';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    selectSelectedAccount,
    selectSelectedAccountEverstakeStakingPool,
} from 'src/reducers/wallet/selectedAccountReducer';
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
        useSelector(selectSelectedAccountEverstakeStakingPool) ?? {};

    // Show success message when claim tx confirmation is complete.
    const prevIsClaimPending = useRef(false);
    const dispatch = useDispatch();
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
    }, [dispatch, isClaimPending, selectedAccount?.symbol]);

    if (!canClaim) return null;

    return isClaimPending ? (
        <ClaimPendingCard claimAmount={claimableAmount} />
    ) : (
        <ClaimReadyCard claimAmount={claimableAmount} />
    );
};
