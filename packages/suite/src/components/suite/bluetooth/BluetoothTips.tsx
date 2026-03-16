import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Box, Button, Card, Column, H3, Row, Text } from '@trezor/components';

import { type DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { TroubleshootingTipsList } from '../troubleshooting/TroubleshootingTipsList';
import { TROUBLESHOOTING_ALL_BLUETOOTH_TIPS } from '../troubleshooting/tips';

type BluetoothTipsProps = {
    onReScanClick: () => void;
    header: ReactNode;
    device?: DesktopBluetoothDevice;
};

export const BluetoothTips = ({ onReScanClick, header, device }: BluetoothTipsProps) => (
    <Card
        header={
            <Row gap={16} justifyContent="space-between">
                <Column>
                    <H3 typographyStyle="body-md-strong">{header}</H3>
                    {device !== undefined &&
                        (device.connectionStatus.type === 'connection-error' ||
                            device.connectionStatus.type === 'pairing-error') && (
                            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                                {device.connectionStatus.error}
                            </Text>
                        )}
                </Column>
                <Button intent="info" size="small" onClick={onReScanClick}>
                    <Translation id="TR_BLUETOOTH_SCAN_AGAIN" />
                </Button>
            </Row>
        }
    >
        <Box padding={{ vertical: 4 }}>
            <TroubleshootingTipsList items={TROUBLESHOOTING_ALL_BLUETOOTH_TIPS} />
        </Box>
    </Card>
);
