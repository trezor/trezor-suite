import { isCountrySubdivisionRequired } from '@suite-common/trading';
import { type CountryChangeContext } from '@suite-native/analytics';
import { useFormContext } from '@suite-native/forms';

import { CountryOfResidencePicker } from './CountrySheet/CountryOfResidencePicker';
import { CountrySubdivisionPicker } from './CountrySheet/CountrySubdivisionPicker';
import { type TradingLocationFormValues } from '../types/tradingLocationForm';

export type TradingLocationPickersProps = {
    context: CountryChangeContext;
    testID: string;
    hasCountrySubdivisionBottomBorder?: boolean;
    hideSubdivisionPicker?: boolean;
};

export const TradingLocationPickers = ({
    context,
    testID,
    hasCountrySubdivisionBottomBorder = false,
    hideSubdivisionPicker = false,
}: TradingLocationPickersProps) => {
    const { watch } = useFormContext<TradingLocationFormValues>();
    const selectedCountry = watch('country');
    const isSubdivisionRequired = isCountrySubdivisionRequired(selectedCountry?.value);

    return (
        <>
            <CountryOfResidencePicker
                testID={`${testID}/country`}
                context={context}
                noBottomBorder={!isSubdivisionRequired || hideSubdivisionPicker}
            />
            {!hideSubdivisionPicker && (
                <CountrySubdivisionPicker
                    testID={`${testID}/country-subdivision`}
                    noBottomBorder={!hasCountrySubdivisionBottomBorder}
                />
            )}
        </>
    );
};
