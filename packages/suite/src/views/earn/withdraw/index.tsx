import { YieldWithdraw } from 'src/components/earn/yield/YieldWithdraw';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

export const EarnWithdraw = () => {
    useLayout('Earn', <PageHeader />);

    return <YieldWithdraw />;
};
