import { useSelector } from 'react-redux';

import { TradingType } from '@suite-common/trading';
import {
    CountryOfResidencePicker,
    selectIsTradingResidenceCheckEnabled,
} from '@suite-native/trading-residence';

export type TradingCountryOfResidencePickerProps = {
    context: TradingType;
    testID: string;
};

export const TradingCountryOfResidencePicker = (props: TradingCountryOfResidencePickerProps) => {
    const isTradingResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);

    if (isTradingResidenceCheckEnabled) {
        return null;
    }

    return <CountryOfResidencePicker {...props} />;
};
