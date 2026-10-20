import { type ReactNode } from 'react';

import { Row, Text } from '@trezor/components';

type CustomNetworkDetailRowProps = {
    label: ReactNode;
    children: ReactNode;
    'data-testid'?: string;
};

export const CustomNetworkDetailRow = ({
    label,
    children,
    'data-testid': dataTestId,
}: CustomNetworkDetailRowProps) => (
    <Row gap={16} justifyContent="space-between" alignItems="center">
        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
            {label}
        </Text>
        <Row flex="0 1 auto" minWidth={0} justifyContent="flex-end" data-testid={dataTestId}>
            {children}
        </Row>
    </Row>
);
