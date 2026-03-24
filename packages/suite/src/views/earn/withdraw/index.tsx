import { YieldPageHeader, YieldWithdraw } from 'src/components/earn';
import { useLayout } from 'src/hooks/suite';

export const EarnWithdraw = () => {
    useLayout('Earn', <YieldPageHeader analyticsStep="yield-withdraw" />);

    return <YieldWithdraw />;
};
