import { CountryOfResidencePicker } from '@suite-native/trading-residence';

const COUNTRY_PICKER_TEST_ID = '@trading/buy/country';

export const BuyCountryOfResidencePicker = () => 
    // TODO 22469 FF switch
     <CountryOfResidencePicker testID={COUNTRY_PICKER_TEST_ID} context="buy" />
;
