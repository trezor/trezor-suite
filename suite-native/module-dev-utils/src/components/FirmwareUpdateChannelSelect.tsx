import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { reloadAppAsync } from 'expo';

import { firmwareActions, selectFirmwareChannel } from '@suite-common/firmware';
import { useAlert } from '@suite-native/alerts';
import { Select, type SelectItemType } from '@suite-native/atoms';
import { type FirmwareChannel } from '@trezor/connect/src/types/firmware';

const options: SelectItemType<FirmwareChannel>[] = [
    { label: 'Production', value: 'production' },
    { label: 'Production Early Access', value: 'production-early-access' },
    { label: 'Test Unsigned', value: 'test-unsigned' },
    { label: 'Test Unsigned Stable', value: 'test-unsigned-stable' },
    { label: 'Test Signed', value: 'test-signed' },
];

export const FirmwareUpdateChannelSelect = () => {
    const dispatch = useDispatch();
    const { showAlert } = useAlert();

    const selectedFirmwareChannel = useSelector(selectFirmwareChannel);

    const handleSelectEnvironment = (environment: FirmwareChannel) => {
        dispatch(firmwareActions.setFirmwareChannel(environment));
        showAlert({
            title: 'Restart the app to apply the change?',
            primaryButtonTitle: 'Restart',
            onPressPrimaryButton: reloadAppAsync,
            secondaryButtonTitle: 'Cancel',
        });
    };

    return (
        <Select<FirmwareChannel>
            title="Channel"
            items={options}
            value={selectedFirmwareChannel}
            onSelectItem={handleSelectEnvironment}
            isLabelShown
        />
    );
};
