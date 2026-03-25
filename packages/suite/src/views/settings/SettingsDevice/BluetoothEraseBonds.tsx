import { useState } from 'react';

import { Translation } from '@suite/intl';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { bluetoothEraseBondsThunk } from '../../../actions/bluetooth/bluetoothEraseBondsThunk';

type BluetoothEraseBondsProps = {
    isDeviceLocked: boolean;
};

export const BluetoothEraseBonds = ({ isDeviceLocked }: BluetoothEraseBondsProps) => {
    const dispatch = useDispatch();
    const device = useSelector(state => state.device.selectedDevice);

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
                description={<Translation id="TR_BLUETOOTH_ERASE_BONDS_SETTINGS_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={onEraseClick}
                    isLoading={inProgress}
                    isDisabled={inProgress || isDeviceLocked}
                    intent="neutral"
                    priority="secondary"
                >
                    <Translation id="TR_BLUETOOTH_ERASE_BONDS_SETTINGS_UNPAIR" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
