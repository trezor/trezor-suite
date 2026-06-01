import { useSelector } from 'react-redux';

import { InlineAlertBox, VStack } from '@suite-native/atoms';
import { selectTradingEnvironment } from '@suite-native/trading-state';

export const TradingEnvironmentWarning = () => {
    const tradingEnvironment = useSelector(selectTradingEnvironment);

    if (tradingEnvironment === 'production') {
        return null;
    }

    return (
        <VStack paddingHorizontal="sp16">
            <InlineAlertBox
                title={`Trading environment: ${tradingEnvironment}`}
                variant="warning"
            />
        </VStack>
    );
};
