import { ReactNode } from 'react';

import { Button, Card, Column, Divider, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { Translation } from '../Translation';
import { TroubleshootingTipsList } from '../troubleshooting/TroubleshootingTipsList';
import { TROUBLESHOOTING_ALL_BLUETOOTH_TIPS } from '../troubleshooting/tips';

type BluetoothTipsProps = {
    onReScanClick: () => void;
    header: ReactNode;
    device?: BluetoothDevice;
};

export const BluetoothTips = ({ onReScanClick, header, device }: BluetoothTipsProps) => (
    <Card>
        <Column gap={spacings.md} alignItems="stretch">
            <Row width="100%" gap={spacings.md} justifyContent="space-between" alignItems="center">
                <Text typographyStyle="body">
                    {header}{' '}
                    {device !== undefined &&
                        (device.connectionStatus.type === 'connection-error' ||
                            device.connectionStatus.type === 'pairing-error') && (
                            <pre>({device.connectionStatus.error})</pre>
                        )}
                </Text>
                <Button variant="primary" size="small" onClick={onReScanClick}>
                    <Translation id="TR_BLUETOOTH_SCAN_AGAIN" />
                </Button>
            </Row>
            <Divider margin={{ vertical: 0, horizontal: 0 }} />
            <TroubleshootingTipsList items={TROUBLESHOOTING_ALL_BLUETOOTH_TIPS} />
        </Column>
    </Card>
);
