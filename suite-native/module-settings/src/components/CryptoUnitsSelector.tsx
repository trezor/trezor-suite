import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Select } from '@suite-native/atoms';
import { PROTO } from '@trezor/connect';

import { selectBitcoinUnits, setBitcoinUnits } from '../slice';

const bitcoinUnitsItems = [
    { label: 'Bitcoin', value: PROTO.AmountUnit.BITCOIN },
    { label: 'Satoshis', value: PROTO.AmountUnit.SATOSHI },
];

export const CryptoUnitsSelector = () => {
    const dispatch = useDispatch();
    const bitcoinUnit = useSelector(selectBitcoinUnits);

    const handleSelectUnit = (value: PROTO.AmountUnit) => {
        dispatch(setBitcoinUnits(value));
    };

    return (
        <Select<PROTO.AmountUnit>
            selectLabel="Bitcoin Amount Units"
            selectValue={bitcoinUnit}
            items={bitcoinUnitsItems}
            onSelectItem={handleSelectUnit}
        />
    );
};
