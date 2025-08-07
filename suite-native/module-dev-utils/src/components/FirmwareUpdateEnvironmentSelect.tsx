import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { firmwareActions, selectFirmwareUpdateSource } from '@suite-common/firmware';
import { Select, SelectItemType } from '@suite-native/atoms';
import { FirmwareUpdateSource } from '@trezor/connect/src/data/firmwareInfo';

const options: SelectItemType<FirmwareUpdateSource>[] = [
    { label: 'Production', value: 'production' },
    { label: 'Test Unsigned', value: 'test-unsigned' },
    { label: 'Test Signed', value: 'test-signed' },
];

export const FirmwareUpdateEnvironmentSelect = () => {
    const selectedFirmwareUpdateSource: FirmwareUpdateSource = useSelector(
        selectFirmwareUpdateSource,
    );
    const dispatch = useDispatch();

    const handleSelectEnvironment = (environment: FirmwareUpdateSource) => {
        dispatch(firmwareActions.setFirmwareUpdateSource(environment));
    };

    return (
        <Select<FirmwareUpdateSource>
            items={options}
            selectLabel="Environment"
            selectValue={selectedFirmwareUpdateSource}
            onSelectItem={handleSelectEnvironment}
        />
    );
};
