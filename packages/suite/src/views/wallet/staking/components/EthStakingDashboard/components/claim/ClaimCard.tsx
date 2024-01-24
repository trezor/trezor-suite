import { ClaimReadyCard } from './ClaimReadyCard';
import { ClaimPendingCard } from './ClaimPendingCard';
import { useClaim } from 'src/hooks/wallet/useClaim';

export const ClaimCard = () => {
    // TODO: Replace with real data
    const isClaimPending = false;
    const { canClaim, claim } = useClaim();

    if (!canClaim) return null;

    return isClaimPending ? (
        <ClaimPendingCard claimAmount={claim.readyForClaim.toString()} />
    ) : (
        <ClaimReadyCard claimAmount={claim.readyForClaim.toString()} />
    );
};
