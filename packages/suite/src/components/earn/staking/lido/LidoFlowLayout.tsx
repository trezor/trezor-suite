import { type ReactNode } from 'react';

import { Column } from '@trezor/components';

type LidoFlowLayoutProps = {
    children: ReactNode;
};

export const LidoFlowLayout = ({ children }: LidoFlowLayoutProps) => (
    <Column alignItems="center">
        <Column gap={24} width="100%" maxWidth={500}>
            {children}
        </Column>
    </Column>
);
