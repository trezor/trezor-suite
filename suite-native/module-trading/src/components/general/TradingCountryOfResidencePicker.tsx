import { useSelector } from 'react-redux';

import { type TradingType } from '@suite-common/trading';
import {
    CountryOfResidencePicker,
    type CountryOfResidencePickerProps,
} from '@suite-native/trading-residence';
import { selectIsTradingResidenceCheckEnabled } from '@suite-native/trading-state';

export type TradingCountryOfResidencePickerProps = Omit<
    CountryOfResidencePickerProps,
    'context'
> & {
    context: Exclude<TradingType, 'exchange'>;
    testID: string;
};

export const TradingCountryOfResidencePicker = (props: TradingCountryOfResidencePickerProps) => {
    const isTradingResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);

    if (isTradingResidenceCheckEnabled) {
        return null;
    }

    return <CountryOfResidencePicker {...props} />;
};
