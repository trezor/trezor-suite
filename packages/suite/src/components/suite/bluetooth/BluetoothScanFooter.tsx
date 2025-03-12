import { BluetoothScanStatus } from '@suite-common/bluetooth';
import { Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { NotTrezorYouAreLookingFor } from './NotTrezorYouAreLookingFor';
import { Translation } from '../Translation';

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
            <Text
                typographyStyle="label"
                variant="tertiary"
                margin={{ horizontal: spacings.md }}
                flex="1"
                align="center"
            >
                <Translation id="TR_BLUETOOTH_SCAN_IDLE_FOOTER" />
            </Text>
        );
    }

    if (scanStatus === 'idle' && numberOfDevices > 0) {
        return <NotTrezorYouAreLookingFor onReScanClick={onReScanClick} />;
    }

    return null;
};
