import { useSelector } from 'react-redux';

import { TradingLocationPickers as ResidenceTradingLocationPickers } from '@suite-native/trading-residence';
import { selectIsTradingResidenceCheckEnabled } from '@suite-native/trading-state';

export type TradingLocationPickersProps = {
    context: 'buy' | 'sell' | 'concierge';
    hideSubdivisionPicker?: boolean;
};

export const TradingLocationPickers = ({
    context,
    hideSubdivisionPicker,
}: TradingLocationPickersProps) => {
    const isTradingResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);

    if (isTradingResidenceCheckEnabled) {
        return null;
    }

    return (
        <ResidenceTradingLocationPickers
            context={context}
            testID={`@trading/${context}`}
            hideSubdivisionPicker={hideSubdivisionPicker}
        />
    );
};
