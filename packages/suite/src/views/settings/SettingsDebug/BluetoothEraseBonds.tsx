import TrezorConnect from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';
import { ActionColumn, ActionButton, SectionItem, TextColumn } from 'src/components/suite';

export const BluetoothEraseBonds = () => {
    const device = useSelector(state => state.device.selectedDevice);
    return (
        <SectionItem data-test="@settings/debug/bluetooth-erase">
            <TextColumn
                title="Devkit"
                description="Offer devkit versions of firmware binaries. Never install regular firmware on devkit and vice versa! Use this only if you know what you are doing."
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={async () => {
                        const s = await TrezorConnect.eraseBonds({ device });
                        console.warn('Erase bonds!', s);
                    }}
                >
                    Erase bluetooth bonds
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
