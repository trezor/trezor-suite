import { useCallback } from 'react';

import { getCountryFlag } from '@suite-common/flags';
import { type CountryChangeContext, events } from '@suite-native/analytics';
import { Flag, HStack, Text } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { OverviewRow, useBottomSheetControls } from '@suite-native/trading-atoms';

import { CountrySheet } from './CountrySheet';
import { type TradingLocationFormValues } from '../../types/tradingLocationForm';

export type CountryOfResidencePickerProps = {
    testID: string;
    context: CountryChangeContext;
    noBottomBorder?: boolean;
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

export const CountryOfResidencePicker = ({
    testID,
    context,
    noBottomBorder = true,
}: CountryOfResidencePickerProps) => {
    const { translate } = useTranslate();
    const analytics = useAnalytics();
    const { isSheetVisible, hideSheet, showSheet } = useBottomSheetControls();

    const { watch, setValue } = useFormContext<TradingLocationFormValues>();
    const selectedValue = watch('country');
    const selectedFlag = getCountryFlag(selectedValue?.value);

    const handleCountrySelect = useCallback(
        (country: TradingLocationFormValues['country']) => {
            const hasCountryChanged = selectedValue?.value !== country?.value;

            setValue('country', country);

            if (hasCountryChanged) {
                setValue('countrySubdivision', undefined);
                reportCountryChange(context, analytics);
            }
        },
        [setValue, selectedValue?.value, context, analytics],
    );

    const valueTestID = `${testID}/value`;

    return (
        <>
            <OverviewRow
                title={translate('tradingResidence.locationSettings.countryOfResidence')}
                onPress={showSheet}
                testID={testID}
                noBottomBorder={noBottomBorder}
            >
                {selectedValue ? (
                    <HStack
                        alignItems="center"
                        accessibilityLabel={translate(
                            'tradingResidence.locationSettings.selectedCountryOfResidence',
                        )}
                    >
                        {selectedFlag && <Flag country={selectedFlag} size={20} />}
                        <Text
                            color="contentSecondary"
                            variant="body-md"
                            numberOfLines={1}
                            testID={valueTestID}
                        >
                            {selectedValue.codeAlpha3}
                        </Text>
                    </HStack>
                ) : (
                    <Text
                        color="contentDisabled"
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
