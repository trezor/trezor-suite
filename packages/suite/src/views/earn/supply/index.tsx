import { YieldPageHeader, YieldSupply } from 'src/components/earn';
import { useLayout } from 'src/hooks/suite';

export const EarnSupply = () => {
    useLayout('Earn', <YieldPageHeader analyticsStep="yield-supply" />);

    return <YieldSupply />;
};
