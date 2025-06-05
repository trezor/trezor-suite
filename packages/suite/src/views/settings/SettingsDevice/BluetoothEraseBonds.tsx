import { useState } from 'react';

import { selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { bluetoothEraseBondsThunk } from '../../../actions/bluetooth/bluetoothEraseBondsThunk';

type BluetoothEraseBondsProps = {
    isDeviceLocked: boolean;
};

export const BluetoothEraseBonds = ({ isDeviceLocked }: BluetoothEraseBondsProps) => {
    const dispatch = useDispatch();
    const device = useSelector(state => state.device.selectedDevice);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    const [inProgress, setInProgress] = useState(false);

    if (!device) {
        return null;
    }

    const onEraseClick = async () => {
        setInProgress(true);
        await dispatch(bluetoothEraseBondsThunk());
        setInProgress(false);
    };

    return (
        <SectionItem data-test="@settings/debug/bluetooth-erase">
            <TextColumn
                title={<Translation id="TR_BLUETOOTH_ERASE_BONDS_SETTINGS" />}
                description={
                    <Translation
                        id="TR_BLUETOOTH_ERASE_BONDS_SETTINGS_DESCRIPTION"
                        values={{ deviceName: deviceLabel }}
                    />
                }
            />
            <ActionColumn>
                <Button
                    onClick={onEraseClick}
                    isLoading={inProgress}
                    isDisabled={inProgress || isDeviceLocked}
                >
                    <Translation id="TR_BLUETOOTH_ERASE_BONDS_SETTINGS_UNPAIR" />
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
