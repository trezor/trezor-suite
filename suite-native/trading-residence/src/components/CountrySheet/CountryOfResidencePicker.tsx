import { useCallback } from 'react';

import { type CountryChangeContext, EventType, analytics } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import { OverviewRow, useBottomSheetControls } from '@suite-native/trading-atoms';

import { CountrySheet } from './CountrySheet';
import { TradingLocationFormValues } from '../../types/tradingLocationForm';

export type CountryOfResidencePickerProps = {
    testID: string;
    context: CountryChangeContext;
};

const reportCountryChange = (type: CountryChangeContext) => {
    analytics.report({
        type: EventType.TradingParameterChanged,
        payload: {
            type,
            parameter: 'country',
        },
    });
};

export const CountryOfResidencePicker = ({ testID, context }: CountryOfResidencePickerProps) => {
    const { translate } = useTranslate();
    const { isSheetVisible, hideSheet, showSheet } = useBottomSheetControls();

    const { watch, setValue } = useFormContext<TradingLocationFormValues>();
    const selectedValue = watch('country');

    const setSelectedValue = useCallback(
        (value: TradingLocationFormValues['country']) => setValue('country', value),
        [setValue],
    );

    const handleCountrySelect = useCallback(
        (country: TradingLocationFormValues['country']) => {
            setSelectedValue(country);

            if (selectedValue?.value !== country?.value) {
                reportCountryChange(context);
            }
        },
        [selectedValue, setSelectedValue, context],
    );

    const valueTestID = testID ? `${testID}/value` : undefined;

    return (
        <>
            <OverviewRow
                title={translate('tradingResidence.locationSettings.countryOfResidence')}
                onPress={showSheet}
                testID={testID}
            >
                {selectedValue ? (
                    <HStack>
                        <Text
                            color="textSubdued"
                            variant="body"
                            accessibilityLabel={translate(
                                'tradingResidence.locationSettings.selectedCountryOfResidence',
                            )}
                            testID={valueTestID}
                        >
                            {selectedValue.label}
                        </Text>
                    </HStack>
                ) : (
                    <Text
                        color="textDisabled"
                        variant="body"
                        accessibilityLabel={translate(
                            'tradingResidence.locationSettings.noCountryOfResidence',
                        )}
                        testID={valueTestID}
                    >
                        <Translation id="tradingResidence.locationSettings.notSelected" />
                    </Text>
                )}
            </OverviewRow>
            <CountrySheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onCountrySelect={handleCountrySelect}
                selectedCountryId={selectedValue?.value}
            />
        </>
    );
};
