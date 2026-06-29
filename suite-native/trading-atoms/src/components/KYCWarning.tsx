import { InlineAlertBox } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

export const KYCWarning = () => {
    const { translate } = useTranslate();

    return (
        <InlineAlertBox
            intent="warning"
            title={<Translation id="moduleTrading.tradingScreen.kycRequired" />}
            accessibilityHint={translate('generic.warning')}
            iconName="identificationCard"
        />
    );
};
