import { Column } from '@trezor/components';

import { EarnStakingTable } from './staking/EarnStakingTable';
import { EarnYieldTable } from './yield/EarnYieldTable';

export const EarnDashboard = () => (
    <Column gap={48}>
        <EarnStakingTable />
        <EarnYieldTable />
    </Column>
);
