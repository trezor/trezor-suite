import { isCountrySubdivisionRequired } from '@suite-common/trading';
import { type CountryChangeContext } from '@suite-native/analytics';
import { useFormContext, useWatch } from '@suite-native/forms';

import { CountryOfResidencePicker } from './CountrySheet/CountryOfResidencePicker';
import { CountrySubdivisionPicker } from './CountrySheet/CountrySubdivisionPicker';
import { type TradingLocationFormValues } from '../types/tradingLocationForm';

type TradingLocationPickersProps = {
    context: CountryChangeContext;
    testID: string;
    hideSubdivisionPicker?: boolean;
    noBottomBorder?: boolean;
};

export const TradingLocationPickers = ({
    context,
    testID,
    hideSubdivisionPicker = false,
    noBottomBorder,
}: TradingLocationPickersProps) => {
    const { control } = useFormContext<TradingLocationFormValues>();
    const selectedCountry = useWatch({ control, name: 'country' });
    const isSubdivisionRequired = isCountrySubdivisionRequired(selectedCountry?.value);

    const residencePickerBottomBorder =
        (!hideSubdivisionPicker && isSubdivisionRequired) || !noBottomBorder;

    return (
        <>
            <CountryOfResidencePicker
                testID={`${testID}/country`}
                context={context}
                noBottomBorder={!residencePickerBottomBorder}
            />
            {!hideSubdivisionPicker && (
                <CountrySubdivisionPicker
                    testID={`${testID}/country-subdivision`}
                    noBottomBorder={noBottomBorder}
                />
            )}
        </>
    );
};
