import { useSelector } from 'react-redux';

import { InlineAlertBox } from '@suite-native/atoms';
import { selectTradingEnvironment } from '@suite-native/trading-state';

export const TradingEnvironmentWarning = () => {
    const tradingEnvironment = useSelector(selectTradingEnvironment);

    if (tradingEnvironment === 'production') {
        return null;
    }

    return (
        <InlineAlertBox title={`Trading environment: ${tradingEnvironment}`} variant="warning" />
    );
};
