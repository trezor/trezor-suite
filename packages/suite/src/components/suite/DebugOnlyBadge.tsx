import { Translation } from '@suite/intl';
import { Badge, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

type DebugOnlyBadgeProps = {
    children?: React.ReactNode;
};

export const DebugOnlyBadge = ({ children }: DebugOnlyBadgeProps) => (
    <Row gap={spacings.xs}>
        {children}
        <Badge intent="warning" size="small">
            <Translation id="TR_DEBUG_ONLY" />
        </Badge>
    </Row>
);
