import { Card, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { CountryOfResidencePicker } from './CountryOfResidencePicker';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { TradingOverviewRow } from '../general/TradingOverviewRow';

const notImplementedCallback = () => {
    // eslint-disable-next-line no-console
    console.log('Not implemented');
};

export const PaymentCard = () => {
    const { translate } = useTranslate();

    return (
        <Card noPadding>
            <PaymentMethodPicker />
            <CountryOfResidencePicker />
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                onPress={notImplementedCallback}
                noBottomBorder
            >
                <Text color="textSubdued" variant="body">
                    Anycoin
                </Text>
            </TradingOverviewRow>
        </Card>
    );
};
