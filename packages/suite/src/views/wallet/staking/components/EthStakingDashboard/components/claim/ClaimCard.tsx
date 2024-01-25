import { useMemo } from 'react';
import { isPending } from '@suite-common/wallet-utils';
import { selectAccountClaimTransactions } from '@suite-common/wallet-core';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite';
import { useClaim } from 'src/hooks/wallet/useClaim';
import { ClaimReadyCard } from './ClaimReadyCard';
import { ClaimPendingCard } from './ClaimPendingCard';

export const ClaimCard = () => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const claimTxs = useSelector(state =>
        selectAccountClaimTransactions(state, selectedAccount?.key || ''),
    );

    const isClaimPending = useMemo(() => claimTxs.some(tx => isPending(tx)), [claimTxs]);

    const { canClaim, claim } = useClaim();

    if (!canClaim) return null;

    return isClaimPending ? (
        <ClaimPendingCard claimAmount={claim.readyForClaim.toString()} />
    ) : (
        <ClaimReadyCard claimAmount={claim.readyForClaim.toString()} />
    );
};
