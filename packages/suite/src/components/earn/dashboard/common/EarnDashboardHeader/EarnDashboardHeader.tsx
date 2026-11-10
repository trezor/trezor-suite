import { selectEarnPositionsCount, useYieldOpportunities } from '@suite-common/wallet-core';
import { Grid } from '@trezor/components';

import { useLayoutSize, useSelector } from '#src/hooks/suite';

import { EarnBalanceBreakdown } from './EarnBalanceBreakdown';
import { EarnBalanceCard } from './EarnBalanceCard';

export const EarnDashboardHeader = () => {
    const { isBelowLaptop } = useLayoutSize();

    const { yieldOpportunities } = useYieldOpportunities();

    const earnPositionsCount = useSelector(state =>
        selectEarnPositionsCount(state, yieldOpportunities),
    );

    if (earnPositionsCount === 0) return null;

    const columns = isBelowLaptop ? 1 : 2;

    return (
        <Grid columns={columns} gap={16}>
            <EarnBalanceCard />
            <EarnBalanceBreakdown />
        </Grid>
    );
};
