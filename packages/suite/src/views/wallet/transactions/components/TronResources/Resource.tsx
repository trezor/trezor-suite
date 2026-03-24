import { type ReactNode } from 'react';

import { Column, ProgressBar, Row, Text, Tooltip } from '@trezor/components';

export type ResourceProps = {
    label: ReactNode;
    tooltip: ReactNode;
    available: number;
    total: number;
};

export const Resource = ({ label, tooltip, available, total }: ResourceProps) => (
    <Column gap={8} minWidth={200} maxWidth={400} flex="1">
        <Row justifyContent="space-between" alignItems="center">
            <Tooltip hasIcon content={tooltip}>
                <Text>{label}</Text>
            </Tooltip>
            <Text>
                {available} / {total}
            </Text>
        </Row>
        <ProgressBar value={available} max={total} />
    </Column>
);
