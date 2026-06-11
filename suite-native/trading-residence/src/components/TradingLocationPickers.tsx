import { isCountrySubdivisionRequired } from '@suite-common/trading';
import { type CountryChangeContext } from '@suite-native/analytics';
import { useFormContext } from '@suite-native/forms';

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
    const { watch } = useFormContext<TradingLocationFormValues>();
    const selectedCountry = watch('country');
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
