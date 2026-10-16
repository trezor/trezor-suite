import { useSelector } from 'react-redux';

import { selectHomeAssetTotalFiatValue } from '@suite-common/assets';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { BASE_CURRENCY_ZERO } from '@suite-common/wallet-utils';
import { DiscreetTextTrigger } from '@suite-native/atoms';
import { BaseCurrencyAmountHeaderFormatter, EmptyAmountSkeleton } from '@suite-native/formatters';

export const PortfolioBalance = () => {
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);
    const totalFiatBalance = useSelector(selectHomeAssetTotalFiatValue) ?? BASE_CURRENCY_ZERO;

    if (hasRunningDiscovery) {
        return <EmptyAmountSkeleton variant="headline-md" />;
    }

    return (
        <DiscreetTextTrigger testID="@home/portfolio-assets/total-balance">
            <BaseCurrencyAmountHeaderFormatter value={totalFiatBalance} />
        </DiscreetTextTrigger>
    );
};
