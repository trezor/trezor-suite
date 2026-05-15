import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { selectBitcoinAmountUnit, setBitcoinAmountUnits } from '@suite-common/wallet-core';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { Select } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { PROTO } from '@trezor/connect';

import { PreferencesSettingsCard } from './PreferencesSettingsCard';

const bitcoinUnitsItems = [
    { label: 'Bitcoin', value: PROTO.AmountUnit.BITCOIN },
    { label: 'Satoshis', value: PROTO.AmountUnit.SATOSHI },
];

export const BitcoinUnitsSelector = () => {
    const dispatch = useDispatch();
    const bitcoinUnit = useSelector(selectBitcoinAmountUnit);
    const { analytics } = useServices<NativeAnalyticsDep>();
    const handleSelectUnit = (value: PROTO.AmountUnit) => {
        dispatch(setBitcoinAmountUnits(value));
        analytics.report({
            type: events.settingsChangeBtcUnitEvent.name,
            payload: { bitcoinUnit: UNIT_ABBREVIATIONS[value] },
        });
    };

    return (
        <PreferencesSettingsCard
            iconName="currencyBtc"
            title={<Translation id="moduleSettings.preferences.bitcoinUnitsLabel" />}
        >
            <Select<PROTO.AmountUnit>
                value={bitcoinUnit}
                title={<Translation id="moduleSettings.preferences.bitcoinUnitsLabel" />}
                items={bitcoinUnitsItems}
                onSelectItem={handleSelectUnit}
                testID="@settings/localization/bitcoin-units-selector"
            />
        </PreferencesSettingsCard>
    );
};
