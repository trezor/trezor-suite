import { type ReactNode } from 'react';

import { Column, Text } from '@trezor/components';

type DeviceDetailProps = { label: string; children: ReactNode };

export const DeviceDetail = ({ label, children }: DeviceDetailProps) => (
    <Column overflow="hidden" flex="1" alignItems="flex-start">
        <Text
            typographyStyle="body-sm"
            ellipsisLineCount={1}
            width="stretch"
            data-testid="@menu/device/label"
        >
            {label}
        </Text>

        {children}
    </Column>
);
