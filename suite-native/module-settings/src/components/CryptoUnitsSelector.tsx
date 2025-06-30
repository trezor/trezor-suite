import { useDispatch, useSelector } from 'react-redux';

import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { selectBitcoinAmountUnit, setBitcoinAmountUnits } from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { Card, HStack, Select, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { PROTO } from '@trezor/connect';

const bitcoinUnitsItems = [
    { label: 'Bitcoin', value: PROTO.AmountUnit.BITCOIN },
    { label: 'Satoshis', value: PROTO.AmountUnit.SATOSHI },
];

export const CryptoUnitsSelector = () => {
    const dispatch = useDispatch();
    const bitcoinUnit = useSelector(selectBitcoinAmountUnit);

    const handleSelectUnit = (value: PROTO.AmountUnit) => {
        dispatch(setBitcoinAmountUnits(value));
        analytics.report({
            type: EventType.SettingsChangeBtcUnit,
            payload: { bitcoinUnit: UNIT_ABBREVIATIONS[value] },
        });
    };

    return (
        <Card>
            <VStack spacing="sp12">
                <HStack alignItems="center">
                    <Icon name="flag" size="mediumLarge" />
                    <Text>
                        <Translation id="moduleSettings.preferences.bitcoinUnitsLabel" />
                    </Text>
                </HStack>
                <Select<PROTO.AmountUnit>
                    selectValue={bitcoinUnit}
                    items={bitcoinUnitsItems}
                    onSelectItem={handleSelectUnit}
                    testID="@settings/localization/bitcoin-units-selector"
                />
            </VStack>
        </Card>
    );
};
