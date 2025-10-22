import { useSelector } from 'react-redux';

import {
    CountryOfResidencePicker,
    selectIsTradingResidenceCheckEnabled,
} from '@suite-native/trading-residence';

const COUNTRY_PICKER_TEST_ID = '@trading/sell/country';

export const SellCountryOfResidencePicker = () => {
    const isTradingResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);

    if (isTradingResidenceCheckEnabled) {
        return null;
    }

    return <CountryOfResidencePicker testID={COUNTRY_PICKER_TEST_ID} context="sell" />;
};
