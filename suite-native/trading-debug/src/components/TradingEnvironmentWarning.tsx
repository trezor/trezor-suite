import { useSelector } from 'react-redux';

import { BannerInline, Box } from '@suite-native/atoms';
import { selectTradingEnvironment } from '@suite-native/trading-state';

export const TradingEnvironmentWarning = () => {
    const tradingEnvironment = useSelector(selectTradingEnvironment);

    if (tradingEnvironment === 'production') {
        return null;
    }

    return (
        <Box paddingHorizontal="sp16">
            <BannerInline title={`Trading environment: ${tradingEnvironment}`} intent="warning" />
        </Box>
    );
};
