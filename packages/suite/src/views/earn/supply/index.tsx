import { YieldSupply } from 'src/components/earn/yield/YieldSupply';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

export const EarnSupply = () => {
    useLayout('Earn', <PageHeader />);

    return <YieldSupply />;
};
