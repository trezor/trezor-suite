import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading, selectTradingSellIsLoading } from '@suite-common/trading';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    type TradingRootState,
    selectBuyBestQuotesForAvailablePaymentMethods,
    selectSellBestQuotesForAvailablePaymentMethods,
} from '@suite-native/trading-state';

type BuySellKYCWarningProps = {
    type: 'buy' | 'sell';
};

export const BuySellKYCWarning = ({ type }: BuySellKYCWarningProps) => {
    const { translate } = useTranslate();

    const shouldShowWarning = useSelector((state: TradingRootState) => {
        const isLoading =
            type === 'buy' ? selectTradingBuyIsLoading(state) : selectTradingSellIsLoading(state);
        const quotes =
            type === 'buy'
                ? selectBuyBestQuotesForAvailablePaymentMethods(state)
                : selectSellBestQuotesForAvailablePaymentMethods(state);

        return !isLoading && quotes.length > 0;
    });

    if (!shouldShowWarning) {
        return null;
    }

    return (
        <InlineAlertBox
            variant="warning"
            title={<Translation id="moduleTrading.tradingScreen.kycRequired" />}
            accessibilityHint={translate('generic.warning')}
            iconName="identificationCard"
        />
    );
};
