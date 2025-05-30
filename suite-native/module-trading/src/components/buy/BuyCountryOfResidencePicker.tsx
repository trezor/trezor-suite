import { EventType, analytics } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { Country } from '../../types/general';
import { CountrySheet } from '../general/CountrySheet/CountrySheet';
import { OverviewRow } from '../general/OverviewRow';

const COUNTRY_PICKER_TEST_ID = '@trading/buy/country';

export const BuyCountryOfResidencePicker = () => {
    const { translate } = useTranslate();
    const form = useBuyFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'country');

    const handleCountrySelect = (country: Country) => {
        setSelectedValue(country);

        if (selectedValue === country) return;

        analytics.report({
            type: EventType.TradingParameterChanged,
            payload: {
                type: 'buy',
                parameter: 'country',
            },
        });
    };

    return (
        <>
            <OverviewRow
                title={translate('moduleTrading.tradingScreen.countryOfResidence')}
                onPress={showSheet}
                testID={COUNTRY_PICKER_TEST_ID}
            >
                {selectedValue ? (
                    <HStack>
                        <Text
                            color="textSubdued"
                            variant="body"
                            accessibilityLabel={translate(
                                'moduleTrading.tradingScreen.selectedCountryOfResidence',
                            )}
                            testID={COUNTRY_PICKER_TEST_ID + '/value'}
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
                        testID={COUNTRY_PICKER_TEST_ID + '/value'}
                    >
                        {translate('moduleTrading.notSelected')}
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
