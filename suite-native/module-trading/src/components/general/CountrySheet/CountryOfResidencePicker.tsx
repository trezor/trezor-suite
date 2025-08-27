import { useCallback } from 'react';

import { TradingType } from '@suite-common/trading';
import { EventType, analytics } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import type { UseFormReturn } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';

import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { BuyFormType, BuyFormValues } from '../../../types/buy';
import { SellFormType, SellFormValues } from '../../../types/sell';
import { OverviewRow } from '../OverviewRow';
import { CountrySheet } from './CountrySheet';

export type CountryOfResidencePickerProps<Form extends BuyFormType | SellFormType> = {
    testID: string;
    form: Form;
    tradingType: TradingType;
};

const reportCountryChange = (type: TradingType) => {
    analytics.report({
        type: EventType.TradingParameterChanged,
        payload: {
            type,
            parameter: 'country',
        },
    });
};

export const CountryOfResidencePicker = <Form extends BuyFormType | SellFormType>({
    form,
    testID,
    tradingType,
}: CountryOfResidencePickerProps<Form>) => {
    const { translate } = useTranslate();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form as UseFormReturn<BuyFormValues | SellFormValues>, 'country');

    const handleCountrySelect = useCallback(
        (country: typeof selectedValue) => {
            setSelectedValue(country);

            if (selectedValue?.value !== country?.value) {
                reportCountryChange(tradingType);
            }
        },
        [selectedValue, setSelectedValue, tradingType],
    );

    return (
        <>
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.countryOfResidence')}
                onPress={showSheet}
                testID={testID}
            >
                {selectedValue ? (
                    <HStack>
                        <Text
                            color="textSubdued"
                            variant="body"
                            accessibilityLabel={translate(
                                'moduleTrading.tradingScreen.selectedCountryOfResidence',
                            )}
                            testID={testID + '/value'}
                        >
                            {selectedValue.label}
                        </Text>
                    </HStack>
                ) : (
                    <Text
                        color="textDisabled"
                        variant="body"
                        accessibilityLabel={translate(
                            'moduleTrading.tradingScreen.noCountryOfResidence',
                        )}
                        testID={testID + '/value'}
                    >
                        <Translation id="moduleTrading.notSelected" />
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
