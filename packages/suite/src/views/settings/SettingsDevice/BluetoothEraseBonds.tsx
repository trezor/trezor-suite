import { useState } from 'react';

import { bluetoothRemoveKnownDeviceAction } from '@suite-common/bluetooth';
import { Button } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const BluetoothEraseBonds = () => {
    const dispatch = useDispatch();
    const device = useSelector(state => state.device.selectedDevice);

    const [inProgress, setInProgress] = useState(false);

    const onEraseClick = async () => {
        setInProgress(true);
        // TODO: missing button request in FW
        const result = await TrezorConnect.eraseBonds({ device });

        if (device?.bluetoothProps?.id !== undefined) {
            dispatch(bluetoothRemoveKnownDeviceAction({ id: device.bluetoothProps.id }));
        }

        console.warn('Erase bonds!', result);
        setInProgress(false);
    };

    return (
        <SectionItem data-test="@settings/debug/bluetooth-erase">
            <TextColumn
                title="Erase bluetooth bonds"
                description="Forget pairing credentials. Trezor will no longer be paired with this computer (require bluetooth module restart? or device disconnect? forget your device in system UI?)"
            />
            <ActionColumn>
                <Button onClick={onEraseClick} isLoading={inProgress} isDisabled={inProgress}>
                    Erase
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
