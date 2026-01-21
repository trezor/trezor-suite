import { useCallback } from 'react';

import {
    type CountryChangeContext,
    EventType,
    SuiteNativeLegacyAnalyticsEvents,
} from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useLegacyAnalytics } from '@suite-native/services';
import { OverviewRow, useBottomSheetControls } from '@suite-native/trading-atoms';
import { Analytics } from '@trezor/analytics';

import { CountrySheet } from './CountrySheet';
import { TradingLocationFormValues } from '../../types/tradingLocationForm';

export type CountryOfResidencePickerProps = {
    testID: string;
    context: CountryChangeContext;
};

const reportCountryChange = (
    type: CountryChangeContext,
    legacyAnalytics: Analytics<SuiteNativeLegacyAnalyticsEvents>,
) => {
    legacyAnalytics.report({
        type: EventType.TradingParameterChanged,
        payload: {
            type,
            parameter: 'country',
        },
    });
};

export const CountryOfResidencePicker = ({ testID, context }: CountryOfResidencePickerProps) => {
    const { translate } = useTranslate();
    const legacyAnalytics = useLegacyAnalytics();
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
                reportCountryChange(context, legacyAnalytics);
            }
        },
        [setSelectedValue, selectedValue?.value, context, legacyAnalytics],
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
                    <HStack>
                        <Text
                            color="textSubdued"
                            variant="body"
                            accessibilityLabel={translate(
                                'tradingResidence.locationSettings.selectedCountryOfResidence',
                            )}
                            testID={valueTestID}
                        >
                            {selectedValue.shortLabel}
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
                testID={testID}
            />
        </>
    );
};
