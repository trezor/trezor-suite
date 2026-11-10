import { EarnDashboard, PageHeader, useLayout } from '@trezor/suite';

export const EarnPage = () => {
    useLayout('Earn', <PageHeader />);

    return <EarnDashboard />;
};
