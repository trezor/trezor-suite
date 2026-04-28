import { useSelector } from 'react-redux';

import { isCountrySubdivisionRequired } from '@suite-common/trading';
import { Button, Text, VStack } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { useCountrySubdivisionPickerControls } from '@suite-native/trading-residence';
import { selectIsTradingResidenceCheckEnabled } from '@suite-native/trading-state';
import { type FormWithFiatCurrencyValues } from '@suite-native/trading-types';

export type TradingCountrySubdivisionPickerButtonProps = {
    testID: string;
};

export const TradingCountrySubdivisionPickerButton = ({
    testID,
}: TradingCountrySubdivisionPickerButtonProps) => {
    const isTradingResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);
    const { showSheet } = useCountrySubdivisionPickerControls();
    const { watch } = useFormContext<FormWithFiatCurrencyValues>();
    const country = watch('country');
    const countrySubdivision = watch('countrySubdivision');

    if (
        isTradingResidenceCheckEnabled ||
        !isCountrySubdivisionRequired(country?.value) ||
        countrySubdivision !== undefined
    ) {
        return null;
    }

    return (
        <VStack>
            <Button onPress={showSheet} testID={testID}>
                <Translation id="tradingResidence.locationSettings.selectCountrySubdivisionButton" />
            </Button>
            <Text variant="body-sm" textAlign="center">
                <Translation id="tradingResidence.locationSettings.selectCountrySubdivisionLabel" />
            </Text>
        </VStack>
    );
};
