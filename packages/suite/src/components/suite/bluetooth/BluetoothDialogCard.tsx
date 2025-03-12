import { ReactNode } from 'react';

import { Card, Column, ElevationUp, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothDialogHeader } from './BluetoothDialogHeader';

export type BluetoothDialogCardProps = {
    children: ReactNode;
    footer?: ReactNode;
    cardHeader?: ReactNode;
    floatingHeader?: ReactNode;
    headerOnClose?: () => void;
};

export const BluetoothDialogCard = ({
    children,
    footer,
    cardHeader,
    floatingHeader,
    headerOnClose,
}: BluetoothDialogCardProps) => {
    const content = (
        <Column
            gap={spacings.md}
            margin={{ vertical: spacings.xxs, horizontal: spacings.xxs }}
            alignItems="stretch"
        >
            <BluetoothDialogHeader onClose={headerOnClose}>{cardHeader}</BluetoothDialogHeader>
            {children}
        </Column>
    );

    return (
        <Column gap={spacings.xxxxl} flex="1" alignItems="stretch">
            {floatingHeader && (
                <Text typographyStyle="titleMedium" align="center">
                    {floatingHeader}
                </Text>
            )}
            <Column gap={spacings.sm} flex="1" alignItems="stretch">
                <Card paddingType="none">
                    {/* Hardcoded +2 in Elevation, intentionally, its is a design decision */}
                    {/*{uiMode === 'spatial' ? <ElevationUp>{content}</ElevationUp> : content}*/}
                    <ElevationUp>{content}</ElevationUp>
                </Card>
                {footer}
            </Column>
        </Column>
    );
};
