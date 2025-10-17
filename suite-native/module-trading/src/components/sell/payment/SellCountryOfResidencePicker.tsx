import { CountryOfResidencePicker } from '@suite-native/trading-residence';

const COUNTRY_PICKER_TEST_ID = '@trading/sell/country';

export const SellCountryOfResidencePicker = () => 
    // TODO 22469 FF switch
     <CountryOfResidencePicker testID={COUNTRY_PICKER_TEST_ID} context="sell" />
;
