import { EventType, analytics } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { Country } from '../../types';
import { CountrySheet } from '../general/CountrySheet/CountrySheet';
import { TradingOverviewRow } from '../general/TradingOverviewRow';

const COUNTRY_PICKER_TEST_ID = '@trading/buy/country';

export const CountryOfResidencePicker = () => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'country');

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
            <TradingOverviewRow
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
            </TradingOverviewRow>
            <CountrySheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onCountrySelect={handleCountrySelect}
                selectedCountryId={selectedValue?.value}
            />
        </>
    );
};
