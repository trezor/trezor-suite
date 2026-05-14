import { Column } from '@trezor/components';

import { useMessageSystemEarnDashboard } from 'src/hooks/suite/useMessageSystemEarnDashboard';

import { EarnDashboardDisabledSection } from './common/EarnDashboardDisabledSection';
import { EarnStakingTable } from './staking/EarnStakingTable';
import { EarnYieldTable } from './yield/EarnYieldTable';

export const EarnDashboard = () => {
    const stakingDashboard = useMessageSystemEarnDashboard('staking');
    const yieldDashboard = useMessageSystemEarnDashboard('yield');

    return (
        <Column gap={48}>
            {stakingDashboard.isDisabled ? (
                <EarnDashboardDisabledSection type="staking" />
            ) : (
                <EarnStakingTable />
            )}

            {yieldDashboard.isDisabled ? (
                <EarnDashboardDisabledSection type="yield" />
            ) : (
                <EarnYieldTable />
            )}
        </Column>
    );
};
