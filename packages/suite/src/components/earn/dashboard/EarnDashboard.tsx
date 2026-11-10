import { Column } from '@trezor/components';

import { EarnDashboardDisabledSection } from './common/EarnDashboardDisabledSection';
import { EarnDashboardHeader } from './common/EarnDashboardHeader/EarnDashboardHeader';
import { EarnStakingTable } from './staking/EarnStakingTable';
import { useReportEarnDashboardReadyEvent } from './useReportEarnDashboardReadyEvent';
import { EarnYieldTable } from './yield/EarnYieldTable';
import { useMessageSystemEarnDashboard } from '../../../hooks/suite/useMessageSystemEarnDashboard';

export const EarnDashboard = () => {
    const stakingDashboard = useMessageSystemEarnDashboard('staking');
    const yieldDashboard = useMessageSystemEarnDashboard('yield');

    const { onStakingReady, onYieldReady } = useReportEarnDashboardReadyEvent({
        isStakingDisabled: stakingDashboard.isDisabled,
        isYieldDisabled: yieldDashboard.isDisabled,
    });

    return (
        <Column gap={48}>
            <EarnDashboardHeader />

            {stakingDashboard.isDisabled ? (
                <EarnDashboardDisabledSection type="staking" />
            ) : (
                <EarnStakingTable onReady={onStakingReady} />
            )}

            {yieldDashboard.isDisabled ? (
                <EarnDashboardDisabledSection type="yield" />
            ) : (
                <EarnYieldTable onReady={onYieldReady} />
            )}
        </Column>
    );
};
