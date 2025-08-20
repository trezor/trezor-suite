import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { CountryOfResidencePicker } from '../../general/CountrySheet/CountryOfResidencePicker';

const COUNTRY_PICKER_TEST_ID = '@trading/sell/country';

export const SellCountryOfResidencePicker = () => {
    const form = useSellFormContext();

    return (
        <CountryOfResidencePicker testID={COUNTRY_PICKER_TEST_ID} form={form} tradingType="sell" />
    );
};
