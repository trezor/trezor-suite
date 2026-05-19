import { EarnYieldEmptyState } from './EarnYieldEmptyState';
import { EarnYieldErrorState } from './EarnYieldErrorState';
import { EarnYieldLoadingState } from './EarnYieldLoadingState';
import { EarnYieldRows } from './EarnYieldRows';
import { type YieldAccountOpportunity, type YieldInactiveVaultOpportunity } from './types';

type EarnYieldTableBodyProps = {
    isYieldOpportunitiesLoading: boolean;
    isYieldOpportunitiesError: boolean;
    onRetry: () => void;
    yieldAccountOpportunities: YieldAccountOpportunity[];
    yieldInactiveVaultOpportunities: YieldInactiveVaultOpportunity[];
    isCardLayout: boolean;
};

export const EarnYieldTableBody = ({
    isYieldOpportunitiesLoading,
    isYieldOpportunitiesError,
    onRetry,
    yieldAccountOpportunities,
    yieldInactiveVaultOpportunities,
    isCardLayout,
}: EarnYieldTableBodyProps) => {
    if (isYieldOpportunitiesLoading) {
        return <EarnYieldLoadingState isCardLayout={isCardLayout} />;
    }

    if (isYieldOpportunitiesError) {
        return <EarnYieldErrorState isCardLayout={isCardLayout} onRetry={onRetry} />;
    }

    if (yieldAccountOpportunities.length === 0 && yieldInactiveVaultOpportunities.length === 0) {
        return <EarnYieldEmptyState isCardLayout={isCardLayout} />;
    }

    return (
        <EarnYieldRows
            accountOpportunities={yieldAccountOpportunities}
            inactiveVaultOpportunities={yieldInactiveVaultOpportunities}
            isCardLayout={isCardLayout}
        />
    );
};
