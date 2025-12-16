import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

import { StakingDashboard } from '../dashboard/StakingDashboard/StakingDashboard';

export const Earn = () => {
    useLayout('Earn', <PageHeader />);

    return <StakingDashboard collapsible={false} />;
};
