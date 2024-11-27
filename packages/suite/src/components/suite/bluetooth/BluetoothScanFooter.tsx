import { Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { NotTrezorYouAreLookingFor } from './NotTrezorYouAreLookingFor';
import { BluetoothScanStatus } from '../../../reducers/bluetooth/bluetoothReducer';

type BluetoothScanFooterProps = {
    onReScanClick: () => void;
    scanStatus: BluetoothScanStatus;
    numberOfDevices: number;
};

export const BluetoothScanFooter = ({
    onReScanClick,
    scanStatus,
    numberOfDevices,
}: BluetoothScanFooterProps) => {
    if (scanStatus === 'running') {
        return (
            <Text typographyStyle="hint" variant="tertiary" margin={{ horizontal: spacings.md }}>
                Make sure your TS7 is on and in pairing mode (hold power button)
            </Text>
        );
    }

    if (scanStatus === 'done' && numberOfDevices > 0) {
        return <NotTrezorYouAreLookingFor onReScanClick={onReScanClick} />;
    }

    return null;
};
