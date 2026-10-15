import { useSelector } from 'react-redux';

import { selectHomeAssetTotalFiatValue } from '@suite-common/assets';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { DiscreetTextTrigger } from '@suite-native/atoms';
import { BaseCurrencyAmountHeaderFormatter, EmptyAmountSkeleton } from '@suite-native/formatters';

export const PortfolioBalance = () => {
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);
    const fiatValue = useSelector(selectHomeAssetTotalFiatValue);

    if (hasRunningDiscovery) {
        return <EmptyAmountSkeleton variant="headline-md" />;
    }

    // Nothing the wallet holds can be priced; a total of zero would say the wallet is empty.
    if (fiatValue === undefined) {
        return null;
    }

    return (
        <DiscreetTextTrigger testID="@home/portfolio-assets/total-balance">
            <BaseCurrencyAmountHeaderFormatter value={fiatValue} />
        </DiscreetTextTrigger>
    );
};
