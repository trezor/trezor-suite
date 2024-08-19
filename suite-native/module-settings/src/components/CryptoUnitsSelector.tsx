import { useDispatch, useSelector } from 'react-redux';

import { Select } from '@suite-native/atoms';
import { PROTO } from '@trezor/connect';
import { analytics, EventType } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import { selectBitcoinUnits, setBitcoinUnits } from '@suite-native/settings';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';

const bitcoinUnitsItems = [
    { label: 'Bitcoin', value: PROTO.AmountUnit.BITCOIN },
    { label: 'Satoshis', value: PROTO.AmountUnit.SATOSHI },
];

export const CryptoUnitsSelector = () => {
    const dispatch = useDispatch();
    const bitcoinUnit = useSelector(selectBitcoinUnits);

    const handleSelectUnit = (value: PROTO.AmountUnit) => {
        dispatch(setBitcoinUnits(value));
        analytics.report({
            type: EventType.SettingsChangeBtcUnit,
            payload: { bitcoinUnit: UNIT_ABBREVIATIONS[value] },
        });
    };

    return (
        <Select<PROTO.AmountUnit>
            selectLabel={<Translation id="moduleSettings.localizations.bitcoinUnitsLabel" />}
            selectValue={bitcoinUnit}
            items={bitcoinUnitsItems}
            onSelectItem={handleSelectUnit}
        />
    );
};
