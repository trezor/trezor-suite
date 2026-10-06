import { useSelector } from 'react-redux';

import { DiscreetTextTrigger } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import { BaseCurrencyAmountHeaderFormatter, EmptyAmountSkeleton } from '@suite-native/formatters';

export const PortfolioBalance = () => {
    const totalFiatBalance = useSelector(selectSelectedDeviceTotalFiatBalance);

    if (totalFiatBalance === undefined) {
        return <EmptyAmountSkeleton variant="headline-md" />;
    }

    return (
        <DiscreetTextTrigger testID="@home/portfolio-assets/total-balance">
            <BaseCurrencyAmountHeaderFormatter value={totalFiatBalance} />
        </DiscreetTextTrigger>
    );
};
