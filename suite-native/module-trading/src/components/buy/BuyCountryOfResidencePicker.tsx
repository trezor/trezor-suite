import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { CountryOfResidencePicker } from '../general/CountrySheet/CountryOfResidencePicker';

const COUNTRY_PICKER_TEST_ID = '@trading/buy/country';

export const BuyCountryOfResidencePicker = () => {
    const form = useBuyFormContext();

    return (
        <CountryOfResidencePicker testID={COUNTRY_PICKER_TEST_ID} form={form} tradingType="buy" />
    );
};
