import { useState } from 'react';

import { Button } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { bluetoothEraseBondsThunk } from '../../../actions/bluetooth/bluetoothEraseBondsThunk';

type BluetoothEraseBondsProps = {
    isDeviceLocked: boolean;
};

export const BluetoothEraseBonds = ({ isDeviceLocked }: BluetoothEraseBondsProps) => {
    const dispatch = useDispatch();
    const device = useSelector(state => state.device.selectedDevice);

    const [inProgress, setInProgress] = useState(false);

    const onEraseClick = async () => {
        if (device) {
            setInProgress(true);
            await dispatch(bluetoothEraseBondsThunk({ device }));
            setInProgress(false);
        }
    };

    return (
        <SectionItem data-test="@settings/debug/bluetooth-erase">
            <TextColumn
                title="Erase bluetooth bonds"
                description="Forget pairing credentials. Trezor will no longer be paired with this computer (require bluetooth module restart? or device disconnect? forget your device in system UI?)"
            />
            <ActionColumn>
                <Button
                    onClick={onEraseClick}
                    isLoading={inProgress}
                    isDisabled={inProgress || isDeviceLocked}
                >
                    Erase
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
