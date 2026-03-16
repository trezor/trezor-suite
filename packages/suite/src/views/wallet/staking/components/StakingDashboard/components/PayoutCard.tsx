import { type ReactNode } from 'react';

import { Card, Column, Icon } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface PayoutCardProps {
    children: ReactNode;
}

export const PayoutCard = ({ children }: PayoutCardProps) => (
    <Card paddingType="small" flex="1">
        <Column alignItems="flex-start" flex="1" gap={spacings.lg}>
            <Icon name="calendar" intent="neutral" priority="secondary" />
            <Column margin={{ top: 'auto' }}>{children}</Column>
        </Column>
    </Card>
);
