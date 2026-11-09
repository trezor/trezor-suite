import { useSelector } from 'react-redux';

import { selectIsTradingConciergeEnabled } from '@suite-native/trading-state';

import { ConciergeTabContent } from './ConciergeTabContent';
import { TradingTypeDisabled } from '../general/Error/TradingTypeDisabled';

export const ConciergeTab = () => {
    const isConciergeEnabled = useSelector(selectIsTradingConciergeEnabled);

    if (!isConciergeEnabled) {
        return <TradingTypeDisabled tradingType="concierge" />;
    }

    return <ConciergeTabContent />;
};
