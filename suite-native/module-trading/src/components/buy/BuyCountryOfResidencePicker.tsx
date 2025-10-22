import { useSelector } from 'react-redux';

import {
    CountryOfResidencePicker,
    selectIsTradingResidenceCheckEnabled,
} from '@suite-native/trading-residence';

const COUNTRY_PICKER_TEST_ID = '@trading/buy/country';

export const BuyCountryOfResidencePicker = () => {
    const isTradingResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);

    if (isTradingResidenceCheckEnabled) {
        return null;
    }

    return <CountryOfResidencePicker testID={COUNTRY_PICKER_TEST_ID} context="buy" />;
};
