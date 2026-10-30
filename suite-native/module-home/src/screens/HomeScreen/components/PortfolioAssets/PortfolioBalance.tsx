import { useSelector } from 'react-redux';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { BASE_CURRENCY_ZERO } from '@suite-common/wallet-utils';
import { Discreet, DiscreetTextTrigger } from '@suite-native/atoms';
import { selectSelectedDeviceTotalFiatBalance } from '@suite-native/device';
import { BaseCurrencyAmountHeaderFormatter, EmptyAmountSkeleton } from '@suite-native/formatters';

export const PortfolioBalance = () => {
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);
    const totalFiatBalance =
        useSelector(selectSelectedDeviceTotalFiatBalance) ?? BASE_CURRENCY_ZERO;

    if (hasRunningDiscovery) {
        return <EmptyAmountSkeleton variant="headline-md" />;
    }

    return (
        <DiscreetTextTrigger testID="@home/portfolio-assets/total-balance">
            <Discreet>
                <BaseCurrencyAmountHeaderFormatter value={totalFiatBalance} />
            </Discreet>
        </DiscreetTextTrigger>
    );
};
