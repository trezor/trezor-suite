import { TruncateWithTooltip, Column } from '@trezor/components';
import { ReactNode } from 'react';

export const DeviceDetail = ({ label, children }: { label: string; children: ReactNode }) => (
    <Column overflow="hidden" flex="1" alignItems="flex-start">
        <TruncateWithTooltip>{label}</TruncateWithTooltip>
        {children}
    </Column>
);
