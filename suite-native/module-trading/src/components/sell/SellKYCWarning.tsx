import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { KYCWarning } from '@suite-native/trading-atoms';
import {
    type TradingRootState,
    selectSellBestQuotesForAvailablePaymentMethods,
} from '@suite-native/trading-state';

export const SellKYCWarning = () => {
    const shouldShowWarning = useSelector((state: TradingRootState) => {
        const isLoading = selectTradingSellIsLoading(state);
        const quotes = selectSellBestQuotesForAvailablePaymentMethods(state);

        return !isLoading && quotes.length > 0;
    });

    if (!shouldShowWarning) {
        return null;
    }

    return <KYCWarning />;
};
