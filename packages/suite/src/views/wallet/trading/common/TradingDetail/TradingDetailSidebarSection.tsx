import { type ReactNode } from 'react';

import { Column } from '@trezor/components';

type TradingDetailSidebarSectionProps = {
    children: ReactNode;
};

export const TradingDetailSidebarSection = ({ children }: TradingDetailSidebarSectionProps) => (
    <Column gap={24} padding={{ horizontal: 24 }}>
        {children}
    </Column>
);
