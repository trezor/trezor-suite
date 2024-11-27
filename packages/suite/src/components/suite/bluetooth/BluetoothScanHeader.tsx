import { spacings } from '@trezor/theme';
import { Button, Row, Spinner, Text } from '@trezor/components';

type BluetoothScanHeaderProps = {
    isScanning: boolean;
    numberOfDevices: number;
    onClose: () => void;
};

export const BluetoothScanHeader = ({
    isScanning,
    onClose,
    numberOfDevices,
}: BluetoothScanHeaderProps) => (
    <Row
        justifyContent="space-between"
        margin={{ top: spacings.sm, left: spacings.lg, right: spacings.lg }}
    >
        <Row gap={spacings.lg}>
            {isScanning ? (
                <>
                    <Spinner isGrey={false} size={spacings.md} />
                    Scanning
                </>
            ) : (
                <Text typographyStyle="hint" variant="tertiary">
                    {numberOfDevices} Trezors Found
                </Text>
            )}
        </Row>
        <Button size="tiny" variant="tertiary" onClick={onClose}>
            Cancel
        </Button>
    </Row>
);
