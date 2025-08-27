import { ReactNode } from 'react';

import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

export type BluetoothDialogCardProps = {
    children: ReactNode;
};

export const BluetoothDialogCard = ({ children }: BluetoothDialogCardProps) => (
    <Column gap={spacings.md} margin={spacings.xxs} alignItems="stretch">
        {children}
    </Column>
);
