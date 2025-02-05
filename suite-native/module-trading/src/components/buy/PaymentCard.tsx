import { Box, Button, Card, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { TradingOverviewRow } from '../general/TradingOverviewRow';

const notImplementedCallback = () => {
    // eslint-disable-next-line no-console
    console.log('Not implemented');
};

export const PaymentCard = () => {
    const { translate } = useTranslate();

    return (
        <Card noPadding>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.paymentMethod')}
                onPress={notImplementedCallback}
            >
                <Text color="textSubdued" variant="body">
                    Credit card
                </Text>
            </TradingOverviewRow>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.countryOfResidence')}
                onPress={notImplementedCallback}
            >
                <Text color="textSubdued" variant="body">
                    Czech Republic
                </Text>
            </TradingOverviewRow>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                onPress={notImplementedCallback}
            >
                <Text color="textSubdued" variant="body">
                    Anycoin
                </Text>
            </TradingOverviewRow>
            <Box padding="sp20">
                <Button onPress={notImplementedCallback}>
                    <Translation id="moduleTrading.tradingScreen.continueButton" />
                </Button>
            </Box>
        </Card>
    );
};
