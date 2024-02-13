import { useState } from 'react';

import { Button } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

export const BluetoothEraseBonds = () => {
    const device = useSelector(state => state.device.selectedDevice);

    const [inProgress, setInProgress] = useState(false);

    const onCheckFirmwareAuthenticity = async () => {
        setInProgress(true);
        // TODO: missing button request in FW
        const result = await TrezorConnect.eraseBonds({ device });
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
                <Button
                    onClick={onCheckFirmwareAuthenticity}
                    isLoading={inProgress}
                    isDisabled={inProgress}
                >
                    Erase
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
