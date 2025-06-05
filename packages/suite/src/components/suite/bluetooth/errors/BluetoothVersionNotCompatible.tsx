import { Button, Text } from '@trezor/components';

import { BluetoothErrorDialog } from './BluetoothErrorDialog';
import { Translation } from '../../Translation';
import { BluetoothConnectUiMode } from '../bluetoothTypes';

type BluetoothVersionNotCompatibleProps = {
    onCancel: () => void;
    uiMode: BluetoothConnectUiMode;
};

export const BluetoothVersionNotCompatible = ({
    onCancel,
    uiMode,
}: BluetoothVersionNotCompatibleProps) => (
    <BluetoothErrorDialog
        uiMode={uiMode}
        buttons={
            <Button onClick={onCancel} variant="tertiary">
                <Translation id="TR_CANCEL" />
            </Button>
        }
        header={<Translation id="TR_BLUETOOTH_VERSION_NOT_COMPATIBLE" />}
    >
        <Text typographyStyle="titleSmall">
            <Translation id="TR_BLUETOOTH_VERSION_NOT_COMPATIBLE_LINE1" />
        </Text>
        <Text typographyStyle="body" variant="tertiary">
            <Translation id="TR_BLUETOOTH_VERSION_NOT_COMPATIBLE_LINE2" />
        </Text>
    </BluetoothErrorDialog>
);
