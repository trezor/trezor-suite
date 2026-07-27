import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Badge, Row } from '@trezor/components';
type DebugOnlyBadgeProps = {
    children?: ReactNode;
};

export const DebugOnlyBadge = ({ children }: DebugOnlyBadgeProps) => (
    <Row gap={8}>
        {children}
        <Badge intent="warning" size="small">
            <Translation id="TR_DEBUG_ONLY" />
        </Badge>
    </Row>
);
