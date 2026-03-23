import { useCallback } from 'react';

import { type CountryChangeContext, events } from '@suite-native/analytics';
import { Text } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { OverviewRow, useBottomSheetControls } from '@suite-native/trading-atoms';

import { CountrySheet } from './CountrySheet';
import { type TradingLocationFormValues } from '../../types/tradingLocationForm';

export type CountryOfResidencePickerProps = {
    testID: string;
    context: CountryChangeContext;
};

const reportCountryChange = (
    type: CountryChangeContext,
    analytics: ReturnType<typeof useAnalytics>,
) => {
    analytics.report({
        type: events.tradingParameterChangedEvent.name,
        payload: {
            type,
            parameter: 'country',
        },
    });
};

export const CountryOfResidencePicker = ({ testID, context }: CountryOfResidencePickerProps) => {
    const { translate } = useTranslate();
    const analytics = useAnalytics();
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
                reportCountryChange(context, analytics);
            }
        },
        [setSelectedValue, selectedValue?.value, context, analytics],
    );

    const valueTestID = testID ? `${testID}/value` : undefined;

    return (
        <>
            <OverviewRow
                title={translate('tradingResidence.locationSettings.countryOfResidence')}
                onPress={showSheet}
                testID={testID}
                noBottomBorder
            >
                {selectedValue ? (
                    <Text
                        color="textSubdued"
                        variant="body-md"
                        accessibilityLabel={translate(
                            'tradingResidence.locationSettings.selectedCountryOfResidence',
                        )}
                        testID={valueTestID}
                        numberOfLines={1}
                    >
                        {selectedValue.shortLabel}
                    </Text>
                ) : (
                    <Text
                        color="textDisabled"
                        variant="body-md"
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
                testID={testID}
            />
        </>
    );
};
