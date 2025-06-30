import { useDispatch, useSelector } from 'react-redux';

import { FiatCurrency, FiatCurrencyCode, fiatCurrencies } from '@suite-common/suite-config';
import { selectLocalCurrency, setLocalCurrency } from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { Card, HStack, Select, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

export const transformFiatCurrencyToSelectItem = ({ code, label }: FiatCurrency) => ({
    value: code,
    label: `${code.toUpperCase()} · ${label}`,
});

const fiatCurrencyItems = Object.values(fiatCurrencies).map(transformFiatCurrencyToSelectItem);

export const CurrencySelector = () => {
    const selectedFiatCurrencyCode = useSelector(selectLocalCurrency);
    const dispatch = useDispatch();

    const handleSelectCurrency = (localCurrency: FiatCurrencyCode) => {
        dispatch(setLocalCurrency(localCurrency));
        analytics.report({
            type: EventType.SettingsChangeCurrency,
            payload: { localCurrency },
        });
    };

    return (
        <Card>
            <VStack spacing="sp12">
                <HStack alignItems="center">
                    <Icon name="flag" size="mediumLarge" />
                    <Text>
                        <Translation id="moduleSettings.preferences.fiatCurrencyLabel" />
                    </Text>
                </HStack>
                <Select<FiatCurrencyCode>
                    items={fiatCurrencyItems}
                    selectValue={selectedFiatCurrencyCode}
                    onSelectItem={handleSelectCurrency}
                    testID="@settings/localization/currency-selector"
                />
            </VStack>
        </Card>
    );
};
