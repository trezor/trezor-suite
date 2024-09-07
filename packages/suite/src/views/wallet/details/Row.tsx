import { Row as RowComponent } from '@trezor/components';
import { ReactNode } from 'react';
import { spacings } from '@trezor/theme';

interface RowProps {
    children: ReactNode;
}

export const Row = ({ children }: RowProps) => (
    <RowComponent justifyContent="space-between" flex="1" gap={spacings.xxl} width="100%">
        {children}
    </RowComponent>
);
