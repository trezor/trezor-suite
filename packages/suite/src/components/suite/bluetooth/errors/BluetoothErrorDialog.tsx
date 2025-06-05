import { ReactNode } from 'react';

import { Card, Column, Icon, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from '../../Translation';
import { BluetoothDialogCard } from '../BluetoothDialogCard';
import { BluetoothConnectUiMode } from '../bluetoothTypes';

type BluetoothErrorDialog = {
    header: ReactNode;
    children: ReactNode;
    uiMode: BluetoothConnectUiMode;
    buttons?: ReactNode;
};

export const BluetoothErrorDialog = ({
    header,
    children,
    buttons,
    uiMode,
}: BluetoothErrorDialog) => (
    <BluetoothDialogCard
        floatingHeader={uiMode === 'spatial' && <Translation id="TR_CONNECT_VIA_BLUETOOTH" />}
        cardHeader={
            <Row gap={spacings.lg}>
                <Icon name="bluetooth" />
                {header}
            </Row>
        }
    >
        <Card>
            <Column alignItems="start" gap={spacings.md}>
                {children}
                <Row gap={spacings.sm}>{buttons}</Row>
            </Column>
        </Card>
    </BluetoothDialogCard>
);
