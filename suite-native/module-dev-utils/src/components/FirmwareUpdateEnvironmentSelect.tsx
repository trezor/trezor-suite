import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { reloadAppAsync } from 'expo';

import { firmwareActions, selectFirmwareUpdateSource } from '@suite-common/firmware';
import { useAlert } from '@suite-native/alerts';
import { Select, SelectItemType } from '@suite-native/atoms';
import { FirmwareUpdateSource } from '@trezor/connect/src/data/firmwareInfo';

const options: SelectItemType<FirmwareUpdateSource>[] = [
    { label: 'Production', value: 'production' },
    { label: 'Test Unsigned', value: 'test-unsigned' },
    { label: 'Test Signed', value: 'test-signed' },
];

export const FirmwareUpdateEnvironmentSelect = () => {
    const dispatch = useDispatch();
    const { showAlert } = useAlert();

    const selectedFirmwareUpdateSource = useSelector(selectFirmwareUpdateSource);

    const handleSelectEnvironment = (environment: FirmwareUpdateSource) => {
        dispatch(firmwareActions.setFirmwareUpdateSource(environment));
        showAlert({
            title: 'Restart the app to apply the change?',
            primaryButtonTitle: 'Restart',
            onPressPrimaryButton: reloadAppAsync,
            secondaryButtonTitle: 'Cancel',
        });
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
