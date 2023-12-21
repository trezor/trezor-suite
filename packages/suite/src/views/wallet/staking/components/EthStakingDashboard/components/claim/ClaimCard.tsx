import { ClaimReadyCard } from './ClaimReadyCard';
import { ClaimPendingCard } from './ClaimPendingCard';

export const ClaimCard = () => {
    // TODO: Replace with real data
    const isClaimPending = false;

    return isClaimPending ? <ClaimPendingCard /> : <ClaimReadyCard />;
};
