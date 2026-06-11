import { useSelector } from 'react-redux';

import { TradingLocationPickers as ResidenceTradingLocationPickers } from '@suite-native/trading-residence';
import { selectIsTradingResidenceCheckEnabled } from '@suite-native/trading-state';

export type TradingLocationPickersProps = {
    context: 'buy' | 'sell' | 'concierge';
    hideSubdivisionPicker?: boolean;
    noBottomBorder?: boolean;
};

export const TradingLocationPickers = ({
    context,
    hideSubdivisionPicker,
    noBottomBorder,
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
            noBottomBorder={noBottomBorder}
        />
    );
};
