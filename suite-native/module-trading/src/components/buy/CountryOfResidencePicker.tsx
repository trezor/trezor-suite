import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { CountrySheet } from '../general/CountrySheet/CountrySheet';
import { TradingOverviewRow } from '../general/TradingOverviewRow';

export const CountryOfResidencePicker = () => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'country');

    return (
        <>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.countryOfResidence')}
                onPress={showSheet}
            >
                {selectedValue ? (
                    <HStack>
                        <Text
                            color="textSubdued"
                            variant="body"
                            accessibilityLabel={translate(
                                'moduleTrading.tradingScreen.selectedCountryOfResidence',
                            )}
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
                    >
                        {translate('moduleTrading.notSelected')}
                    </Text>
                )}
            </TradingOverviewRow>
            <CountrySheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onCountrySelect={setSelectedValue}
                selectedCountryId={selectedValue?.value}
            />
        </>
    );
};
