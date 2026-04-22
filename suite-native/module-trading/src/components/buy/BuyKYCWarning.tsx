import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectBuyBestQuotesForAvailablePaymentMethods } from '@suite-native/trading-state';

export const BuyKYCWarning = () => {
    const { translate } = useTranslate();

    const isLoading = useSelector(selectTradingBuyIsLoading);
    const quotes = useSelector(selectBuyBestQuotesForAvailablePaymentMethods);

    const shouldShowWarning = !isLoading && quotes.length > 0;

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
