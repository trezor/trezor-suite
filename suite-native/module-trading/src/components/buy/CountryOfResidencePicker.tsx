import { HStack, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { Country } from '../../types';
import { CountrySheet } from '../general/CountrySheet/CountrySheet';
import { TradingOverviewRow } from '../general/TradingOverviewRow';

export const CountryOfResidencePicker = () => {
    const { translate } = useTranslate();

    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls<Country>();

    return (
        <>
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.countryOfResidence')}
                onPress={showSheet}
            >
                {selectedValue ? (
                    <HStack>
                        <Text color="textSubdued" variant="body">
                            {selectedValue.value}
                        </Text>
                    </HStack>
                ) : (
                    <Text color="textDisabled" variant="body">
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
