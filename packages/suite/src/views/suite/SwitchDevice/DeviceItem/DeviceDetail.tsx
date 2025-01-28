import { ReactNode } from 'react';

import { Column, TruncateWithTooltip } from '@trezor/components';

export const DeviceDetail = ({ label, children }: { label: string; children: ReactNode }) => (
    <Column overflow="hidden" flex="1" alignItems="flex-start">
        <TruncateWithTooltip>
            <span data-testid="@menu/device/label">{label}</span>
        </TruncateWithTooltip>
        {children}
    </Column>
);
