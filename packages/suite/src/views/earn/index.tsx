import { Column } from '@trezor/components';

import { StablecoinYields } from 'src/components/earn/StablecoinYields';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

import { StakingDashboard } from '../dashboard/StakingDashboard/StakingDashboard';

export const Earn = () => {
    useLayout('Earn', <PageHeader />);

    return (
        <Column gap={24}>
            <StakingDashboard collapsible={false} />
            <StablecoinYields />
        </Column>
    );
};
