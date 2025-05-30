import { useSelector } from 'react-redux';

import { Text, VStack } from '@suite-native/atoms';

import { selectIsTradingExchangeEnabled } from '../../selectors/commonSelectors';
import { TradingTypeDisabled } from '../general/offline/TradingTypeDisabled';

export const ExchangeTab = () => {
    const isExchangeEnabled = useSelector(selectIsTradingExchangeEnabled);

    if (!isExchangeEnabled) {
        return <TradingTypeDisabled tradingType="exchange" />;
    }

    return (
        <VStack>
            <Text variant="titleMedium" color="textDefault">
                Exchange Tab placeholder
            </Text>
        </VStack>
    );
};
