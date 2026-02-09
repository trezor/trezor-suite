import { EarnDashboard } from 'src/components/earn';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

export const Earn = () => {
    useLayout('Earn', <PageHeader />);

    return <EarnDashboard />;
};
