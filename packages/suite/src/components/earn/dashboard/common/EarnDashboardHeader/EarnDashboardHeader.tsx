import { Grid } from '@trezor/components';

import { useLayoutSize } from 'src/hooks/suite';

import { EarnBalanceBreakdown } from './EarnBalanceBreakdown';
import { EarnBalanceCard } from './EarnBalanceCard';

export const EarnDashboardHeader = () => {
    const { isBelowLaptop } = useLayoutSize();

    const columns = isBelowLaptop ? 1 : 2;

    return (
        <Grid columns={columns} gap={16}>
            <EarnBalanceCard />
            <EarnBalanceBreakdown />
        </Grid>
    );
};
