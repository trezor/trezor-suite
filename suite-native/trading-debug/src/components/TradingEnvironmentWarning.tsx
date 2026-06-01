import { useSelector } from 'react-redux';

import { Box, InlineAlertBox } from '@suite-native/atoms';
import { selectTradingEnvironment } from '@suite-native/trading-state';

export const TradingEnvironmentWarning = () => {
    const tradingEnvironment = useSelector(selectTradingEnvironment);

    if (tradingEnvironment === 'production') {
        return null;
    }

    return (
        <Box paddingHorizontal="sp16">
            <InlineAlertBox
                title={`Trading environment: ${tradingEnvironment}`}
                variant="warning"
            />
        </Box>
    );
};
