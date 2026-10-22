import { Column } from '@trezor/components';

import { useMessageSystemEarnDashboard } from 'src/hooks/suite/useMessageSystemEarnDashboard';

import { EarnDashboardDisabledSection } from './common/EarnDashboardDisabledSection';
import { EarnStakingTable } from './staking/EarnStakingTable';
import { useReportEarnDashboardReadyEvent } from './useReportEarnDashboardReadyEvent';
import { EarnYieldTable } from './yield/EarnYieldTable';

export const EarnDashboard = () => {
    const stakingDashboard = useMessageSystemEarnDashboard('staking');
    const yieldDashboard = useMessageSystemEarnDashboard('yield');
    const { onStakingReady, onYieldReady } = useReportEarnDashboardReadyEvent({
        isStakingDisabled: stakingDashboard.isDisabled,
        isYieldDisabled: yieldDashboard.isDisabled,
    });

    return (
        <Column gap={48}>
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
