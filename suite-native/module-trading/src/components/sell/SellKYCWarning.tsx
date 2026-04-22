import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectSellBestQuotesForAvailablePaymentMethods } from '@suite-native/trading-state';

export const SellKYCWarning = () => {
    const { translate } = useTranslate();

    const isLoading = useSelector(selectTradingSellIsLoading);
    const quotes = useSelector(selectSellBestQuotesForAvailablePaymentMethods);

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
