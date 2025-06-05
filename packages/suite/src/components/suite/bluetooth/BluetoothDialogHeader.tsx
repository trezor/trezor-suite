import { ReactNode } from 'react';

import { Button, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from '../Translation';

type BluetoothScanHeaderProps = {
    children?: ReactNode;
    onClose?: () => void;
};

export const BluetoothDialogHeader = ({ children, onClose }: BluetoothScanHeaderProps) => (
    <Row justifyContent="space-between" margin={{ top: spacings.sm, horizontal: spacings.lg }}>
        <Row gap={spacings.lg}>{children}</Row>
        {onClose && (
            <Button size="tiny" variant="tertiary" onClick={onClose}>
                <Translation id="TR_CANCEL" />
            </Button>
        )}
    </Row>
);
