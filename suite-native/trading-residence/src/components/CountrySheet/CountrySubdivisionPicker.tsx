import { useCallback } from 'react';

import {
    type TradingCountrySubdivisionOption,
    isCountrySubdivisionRequired,
} from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import { OverviewRow } from '@suite-native/trading-atoms';

import { useCountrySubdivisionPickerControls } from './CountrySubdivisionPickerControlsContext';
import { CountrySubdivisionSheet } from './CountrySubdivisionSheet';
import { type TradingLocationFormValues } from '../../types/tradingLocationForm';

export type CountrySubdivisionPickerProps = {
    testID: string;
    noBottomBorder?: boolean;
};

export const CountrySubdivisionPicker = ({
    testID,
    noBottomBorder = false,
}: CountrySubdivisionPickerProps) => {
    const { translate } = useTranslate();
    const { isSheetVisible, hideSheet, showSheet } = useCountrySubdivisionPickerControls();
    const { watch, setValue } = useFormContext<TradingLocationFormValues>();
    const selectedCountry = watch('country');
    const selectedValue = watch('countrySubdivision');
    const isSubdivisionRequired = isCountrySubdivisionRequired(selectedCountry?.value);

    const handleSubdivisionSelect = useCallback(
        (subdivision: TradingCountrySubdivisionOption) => {
            setValue('countrySubdivision', subdivision);
        },
        [setValue],
    );

    if (!isSubdivisionRequired) {
        return null;
    }

    const valueTestID = `${testID}/value`;

    return (
        <>
            <OverviewRow
                title={translate('tradingResidence.locationSettings.countrySubdivision')}
                onPress={showSheet}
                testID={testID}
                noBottomBorder={noBottomBorder}
            >
                {selectedValue ? (
                    <Text
                        color="contentSecondary"
                        variant="body-md"
                        accessibilityLabel={translate(
                            'tradingResidence.locationSettings.selectedCountrySubdivision',
                        )}
                        testID={valueTestID}
                        numberOfLines={1}
                    >
                        {selectedValue.name}
                    </Text>
                ) : (
                    <Text
                        color="contentDisabled"
                        variant="body-md"
                        accessibilityLabel={translate(
                            'tradingResidence.locationSettings.noCountrySubdivision',
                        )}
                        testID={valueTestID}
                    >
                        <Translation id="tradingResidence.locationSettings.notSelected" />
                    </Text>
                )}
            </OverviewRow>
            <CountrySubdivisionSheet
                countryCode={selectedCountry?.value}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onSubdivisionSelect={handleSubdivisionSelect}
                selectedSubdivisionId={selectedValue?.value}
                testID={testID}
            />
        </>
    );
};
